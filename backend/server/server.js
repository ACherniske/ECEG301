// server.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

//middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())

// Google Sheets Setup
let sheets = null
let auth = null

const initializeGoogleSheets = async () => {
    try {
        // Parse service account credentials from environment
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        
        auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        sheets = google.sheets({ version: 'v4', auth })
        console.log('Google Sheets API initialized')
    } catch (error) {
        console.error('Failed to initialize Google Sheets:', error.message)
        process.exit(1)
    }
}

// Initialize Google Sheets on startup
await initializeGoogleSheets()

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const RIDES_SHEET = process.env.RIDES_SHEET || 'Rides'
const PATIENTS_SHEET = 'Patients'
const APPOINTMENTS_SHEET = 'Appointments'
const DRIVER_ACCOUNTS_SHEET = 'DriverAccounts'

// Define ranges for each sheet based on their columns
const RIDES_RANGE = 'A:J'        // OrgId, ID, PatientName, PatientId, AppointmentDate, PickupTime, AppointmentTime, Location, Status, Notes
const PATIENTS_RANGE = 'A:G'     // OrgId, PatientId, FirstName, LastName, DateOfBirth, Phone, Address
const APPOINTMENTS_RANGE = 'A:H' // OrgId, PatientId, AppointmentId, AppointmentType, Date, Time, Location, ProviderName
const DRIVERS_RANGE = 'A:F'      // OrgId, DriverId, Name, Make, Model, LicensePlate

// Middleware to verify auth token (basic implementation)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    // For development, you can skip validation
    // In production, implement proper JWT verification
    if (!token && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Authentication required' })
    }
    
    // TODO: Verify JWT token here
    // For now, just pass through
    next()
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sheets: sheets ? 'connected' : 'disconnected'
    })
})

// Helper function to check if date is today
const isToday = (dateString) => {
    if (!dateString) return false
    try {
        const today = new Date()
        const checkDate = new Date(dateString)
        return today.getDate() === checkDate.getDate() &&
                     today.getMonth() === checkDate.getMonth() &&
                     today.getFullYear() === checkDate.getFullYear()
    } catch {
        return false
    }
}

// GET /api/org/:orgId/rides - Fetch rides for specific org
app.get('/api/org/:orgId/rides', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RIDES_RANGE}`,
        })

        const rows = response.data.values || []
        
        if (rows.length === 0) {
            return res.json([])
        }

        // Skip header row
        const dataRows = rows.slice(1)
        
        // Convert rows to ride objects and filter by orgId
        const rides = dataRows.map((row, index) => {
            const safeRow = [...row]
            while (safeRow.length < 10) {  // Updated to 10 columns
                safeRow.push('')
            }
            
            return {
                orgId: safeRow[0] || '',
                id: safeRow[1] || (index + 1).toString(),
                patientName: safeRow[2] || '',
                patientId: safeRow[3] || '',
                appointmentDate: safeRow[4] || '',
                pickupTime: safeRow[5] || '',
                appointmentTime: safeRow[6] || '',
                location: safeRow[7] || '',
                status: safeRow[8] || 'pending',
                notes: safeRow[9] || '',  // Added notes column
                rowIndex: index + 2
            }
        })
        .filter(ride => ride.patientName && ride.orgId === orgId) // Filter by org

        console.log(`Fetched ${rides.length} rides for org ${orgId}`)
        res.json(rides)
    } catch (error) {
        console.error('Error fetching rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// PATCH /api/org/:orgId/rides/:rideId/status - Update ride status
app.patch('/api/org/:orgId/rides/:rideId/status', authenticateToken, async (req, res) => {
    try {
        const { orgId, rideId } = req.params
        const { status, rowIndex } = req.body
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' })
        }
        
        if (!rowIndex) {
            return res.status(400).json({ error: 'Row index is required' })
        }

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status value' })
        }

        // Verify the ride belongs to this org
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}`,
        })

        const rideOrgId = response.data.values?.[0]?.[0]
        if (rideOrgId !== orgId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }

        // Update cell I (status column - now 9th column)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!I${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[status]]
            }
        })

        console.log(`Updated ride ${rideId} status to ${status} for org ${orgId}`)
        res.json({ 
            success: true, 
            rideId, 
            status,
            rowIndex
        })
    } catch (error) {
        console.error('Error updating ride status:', error)
        res.status(500).json({ error: error.message })
    }
})

// PATCH /api/org/:orgId/rides/:rideId - Update ride fields (time, location, etc.)
app.patch('/api/org/:orgId/rides/:rideId', authenticateToken, async (req, res) => {
    try {
        const { orgId, rideId } = req.params
        const { pickupTime, appointmentTime, location, notes, rowIndex } = req.body  // Added notes
        
        if (!rowIndex) {
            return res.status(400).json({ error: 'Row index is required' })
        }

        // Verify the ride belongs to this org
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}:J${rowIndex}`,  // Updated to include column J
        })

        const rideRow = response.data.values?.[0]
        if (!rideRow || rideRow[0] !== orgId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }

        // Prepare batch update data
        const updates = []
        
        if (pickupTime !== undefined) {
            updates.push({
                range: `${RIDES_SHEET}!F${rowIndex}`, // Column F = pickupTime
                values: [[pickupTime]]
            })
        }
        
        if (appointmentTime !== undefined) {
            updates.push({
                range: `${RIDES_SHEET}!G${rowIndex}`, // Column G = appointmentTime  
                values: [[appointmentTime]]
            })
        }
        
        if (location !== undefined) {
            updates.push({
                range: `${RIDES_SHEET}!H${rowIndex}`, // Column H = location
                values: [[location]]
            })
        }

        if (notes !== undefined) {
            updates.push({
                range: `${RIDES_SHEET}!J${rowIndex}`, // Column J = notes
                values: [[notes]]
            })
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' })
        }

        // Perform batch update
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                valueInputOption: 'RAW',
                data: updates
            }
        })

        console.log(`Updated ride ${rideId} fields for org ${orgId}`)
        res.json({ 
            success: true, 
            rideId,
            updatedFields: { pickupTime, appointmentTime, location, notes },  // Added notes
            rowIndex
        })
    } catch (error) {
        console.error('Error updating ride:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/org/:orgId/rides - Add new ride
app.post('/api/org/:orgId/rides', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const ride = req.body
        
        // Validate required fields
        if (!ride.patientName || !ride.patientId) {
            return res.status(400).json({ 
                error: 'Patient name and ID are required' 
            })
        }

        // Generate ID if not provided
        if (!ride.id) {
            // Fetch existing rides for this org to generate next ID
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${RIDES_SHEET}!A:B`,
            })
            
            const orgRides = (response.data.values || [])
                .slice(1) // Skip header
                .filter(row => row[0] === orgId) // Filter by org
                .map(row => parseInt(row[1]))
                .filter(id => !isNaN(id))
            
            ride.id = orgRides.length > 0 
                ? (Math.max(...orgRides) + 1).toString()
                : '1'
        }

        // Prepare row data with orgId as first column
        const values = [
            orgId, // Add orgId
            ride.id,
            ride.patientName,
            ride.patientId,
            ride.appointmentDate || new Date().toISOString().split('T')[0],
            ride.pickupTime || '',
            ride.appointmentTime || '',
            ride.location || '',
            ride.status || 'pending',
            ride.notes || ''  // Added notes column
        ]

        // Append to sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RIDES_RANGE}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [values]
            }
        })

        console.log(`Added new ride ${ride.id} for org ${orgId}`)
        res.status(201).json({ 
            success: true, 
            ride: {
                orgId,
                ...ride,
                id: ride.id
            }
        })
    } catch (error) {
        console.error('Error adding ride:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/invitations - Fetch invitations (placeholder)
app.get('/api/org/:orgId/invitations', authenticateToken, async (req, res) => {
    // TODO: Implement with actual data source
    res.json([])
})

// POST /api/org/:orgId/invitations - Create invitation (placeholder)
app.post('/api/org/:orgId/invitations', authenticateToken, async (req, res) => {
    // TODO: Implement with actual data source
    res.status(201).json({ 
        id: Date.now().toString(),
        ...req.body 
    })
})

// DELETE /api/org/:orgId/invitations/:invitationId - Delete invitation (placeholder)
app.delete('/api/org/:orgId/invitations/:invitationId', authenticateToken, async (req, res) => {
    // TODO: Implement with actual data source
    res.json({ success: true })
})

// GET /api/org/:orgId/users - Fetch users (placeholder)
app.get('/api/org/:orgId/users', authenticateToken, async (req, res) => {
    // TODO: Implement with actual data source
    res.json([])
})

// DELETE /api/org/:orgId/users/:userId - Remove user (placeholder)
app.delete('/api/org/:orgId/users/:userId', authenticateToken, async (req, res) => {
    // TODO: Implement with actual data source
    res.json({ success: true })
})

// GET /api/org/:orgId/ehr/patients/search - Search patients
app.get('/api/org/:orgId/ehr/patients/search', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const { query } = req.query

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Search query is required' })
        }

        // Fetch all patients from Patients sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PATIENTS_SHEET}!${PATIENTS_RANGE}`,
        })

        const rows = response.data.values || []
        
        if (rows.length === 0) {
            return res.json([])
        }

        // Skip header row
        const dataRows = rows.slice(1)
        
        // Search by patient name, ID, or phone (case-insensitive)
        const searchLower = query.toLowerCase().trim()
        const results = dataRows
            .filter(row => {
                // Ensure we have enough columns
                const safeRow = [...row]
                while (safeRow.length < 7) {
                    safeRow.push('')
                }
                
                // Check if belongs to this org
                if (safeRow[0] !== orgId) return false
                
                const firstName = safeRow[2]?.toLowerCase() || ''
                const lastName = safeRow[3]?.toLowerCase() || ''
                const patientId = safeRow[1]?.toLowerCase() || ''
                const phone = safeRow[5]?.toLowerCase() || ''
                const fullName = `${firstName} ${lastName}`.toLowerCase()
                
                // Check for exact ID match or partial name/phone match
                return patientId === searchLower ||
                       firstName.includes(searchLower) ||
                       lastName.includes(searchLower) ||
                       fullName.includes(searchLower) ||
                       phone.includes(searchLower)
            })
            .map((row) => {
                const safeRow = [...row]
                while (safeRow.length < 7) {
                    safeRow.push('')
                }
                
                return {
                    id: safeRow[1],
                    firstName: safeRow[2],
                    lastName: safeRow[3],
                    dateOfBirth: safeRow[4],
                    phone: safeRow[5],
                    address: safeRow[6]
                }
            })

        console.log(`Found ${results.length} patients for query: "${query}" in org ${orgId}`)
        res.json(results)
    } catch (error) {
        console.error('Error searching patients:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/drivers - Get driver accounts
app.get('/api/org/:orgId/drivers', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${DRIVERS_RANGE}`,
        })

        const rows = response.data.values || []
        
        if (rows.length === 0) {
            return res.json([])
        }

        // Skip header row and filter by organization
        const drivers = rows
            .slice(1)
            .filter(row => row[0] === orgId)
            .map((row) => {
                const safeRow = [...row]
                while (safeRow.length < 6) {
                    safeRow.push('')
                }
                
                return {
                    id: safeRow[1],
                    name: safeRow[2],
                    make: safeRow[3],
                    model: safeRow[4],
                    licensePlate: safeRow[5]
                }
            })

        console.log(`Fetched ${drivers.length} drivers for org ${orgId}`)
        res.json(drivers)
    } catch (error) {
        console.error('Error fetching drivers:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/ehr/patients/:patientId - Get patient details
app.get('/api/org/:orgId/ehr/patients/:patientId', authenticateToken, async (req, res) => {
    try {
        const { orgId, patientId } = req.params

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PATIENTS_SHEET}!${PATIENTS_RANGE}`,
        })

        const rows = response.data.values || []
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' })
        }

        // Find patient in the sheet
        const patientRow = rows.slice(1).find(row => row[0] === orgId && row[1] === patientId)
        
        if (!patientRow) {
            return res.status(404).json({ error: 'Patient not found' })
        }

        const patient = {
            id: patientRow[1],
            firstName: patientRow[2],
            lastName: patientRow[3],
            dateOfBirth: patientRow[4],
            phone: patientRow[5],
            address: patientRow[6]
        }

        console.log(`Fetched patient ${patientId} for org ${orgId}`)
        res.json(patient)
    } catch (error) {
        console.error('Error fetching patient:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/ehr/patients/:patientId/appointments - Get patient appointments
app.get('/api/org/:orgId/ehr/patients/:patientId/appointments', authenticateToken, async (req, res) => {
    try {
        const { orgId, patientId } = req.params

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!${APPOINTMENTS_RANGE}`,
        })

        const rows = response.data.values || []
        
        if (rows.length === 0) {
            return res.json([])
        }

        // Skip header and filter by org and patient
        const appointments = rows
            .slice(1)
            .filter(row => row[0] === orgId && row[1] === patientId)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 8) {
                    safeRow.push('')
                }
                
                return {
                    id: safeRow[2],
                    appointmentType: safeRow[3],
                    appointmentDate: safeRow[4],
                    appointmentTime: safeRow[5],
                    location: safeRow[6],
                    providerName: safeRow[7],
                    status: 'scheduled', // Default status
                    rowIndex: index + 2
                }
            })

        console.log(`Fetched ${appointments.length} appointments for patient ${patientId}`)
        res.json(appointments)
    } catch (error) {
        console.error('Error fetching appointments:', error)
        res.status(500).json({ error: error.message })
    }
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Connected to Google Sheet: ${SHEET_ID}`)
    console.log(`Sheet name: ${RIDES_SHEET}`)
})

export default app