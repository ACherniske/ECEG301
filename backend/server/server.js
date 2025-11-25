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
const SHEET_NAME = process.env.SHEET_NAME || 'Rides'
// Update the range to A:I (added one more column)
const SHEET_RANGE = 'A:I'

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
            range: `${SHEET_NAME}!${SHEET_RANGE}`,
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
            while (safeRow.length < 9) {
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
            range: `${SHEET_NAME}!A${rowIndex}`,
        })

        const rideOrgId = response.data.values?.[0]?.[0]
        if (rideOrgId !== orgId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }

        // Update cell I (status column - now 9th column)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!I${rowIndex}`,
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
        const { pickupTime, appointmentTime, location, rowIndex } = req.body
        
        if (!rowIndex) {
            return res.status(400).json({ error: 'Row index is required' })
        }

        // Verify the ride belongs to this org
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A${rowIndex}:I${rowIndex}`,
        })

        const rideRow = response.data.values?.[0]
        if (!rideRow || rideRow[0] !== orgId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }

        // Prepare batch update data
        const updates = []
        
        if (pickupTime !== undefined) {
            updates.push({
                range: `${SHEET_NAME}!F${rowIndex}`, // Column F = pickupTime
                values: [[pickupTime]]
            })
        }
        
        if (appointmentTime !== undefined) {
            updates.push({
                range: `${SHEET_NAME}!G${rowIndex}`, // Column G = appointmentTime  
                values: [[appointmentTime]]
            })
        }
        
        if (location !== undefined) {
            updates.push({
                range: `${SHEET_NAME}!H${rowIndex}`, // Column H = location
                values: [[location]]
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
            updatedFields: { pickupTime, appointmentTime, location },
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
                range: `${SHEET_NAME}!A:B`,
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
            ride.status || 'pending'
        ]

        // Append to sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:I`,
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
    console.log(`Sheet name: ${SHEET_NAME}`)
})

export default app