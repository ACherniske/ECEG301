import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, DRIVER_ACCOUNTS_SHEET, RIDES_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Helper function to get driver details by ID
const getDriverById = async (driverId) => {
    try {
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return null

        // Find driver by userId (column A)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row[0] === driverId) {
                const safeRow = [...row]
                while (safeRow.length < 10) safeRow.push('')
                
                return {
                    userId: safeRow[0],
                    email: safeRow[1],
                    firstName: safeRow[2],
                    lastName: safeRow[3],
                    status: safeRow[4] || 'active',
                    createdAt: safeRow[5],
                    // Don't return password for security
                    address: safeRow[7],
                    driverMake: safeRow[8],
                    driverModel: safeRow[9]
                }
            }
        }
        return null
    } catch (error) {
        console.error('Error fetching driver:', error)
        return null
    }
}

// GET /api/org/:orgId/drivers - Get all drivers for an organization
router.get('/:orgId/drivers', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const drivers = rows.slice(1)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 10) safeRow.push('')
                
                return {
                    rowIndex: index + 2, // Add 2 because of header and 0-based indexing
                    userId: safeRow[0],
                    email: safeRow[1],
                    firstName: safeRow[2],
                    lastName: safeRow[3],
                    status: safeRow[4] || 'active',
                    createdAt: safeRow[5],
                    // Don't return password for security
                    address: safeRow[7],
                    driverMake: safeRow[8],
                    driverModel: safeRow[9]
                }
            })
            .filter(driver => driver.status === 'active') // Only return active drivers

        console.log(`Fetched ${drivers.length} drivers`)
        res.json(drivers)
    } catch (error) {
        console.error('Error fetching drivers:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/drivers/:driverId - Get specific driver details
router.get('/:orgId/drivers/:driverId', authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params
        
        const driver = await getDriverById(driverId)
        
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' })
        }
        
        res.json(driver)
    } catch (error) {
        console.error('Error fetching driver:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/drivers/:driverId/available-rides - Get available rides for a driver to claim
router.get('/:orgId/drivers/:driverId/available-rides', authenticateToken, async (req, res) => {
    try {
        const { orgId, driverId } = req.params
        
        // Verify driver exists and belongs to this org
        const driver = await getDriverById(driverId)
        if (!driver || driver.orgId !== orgId) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const availableRides = rows.slice(1)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 17) safeRow.push('') // Updated to 17 columns (A-Q)
                
                return {
                    rowIndex: index + 2,
                    orgId: safeRow[0],
                    id: safeRow[1],
                    patientName: safeRow[2],
                    patientId: safeRow[3],
                    appointmentDate: safeRow[4],
                    appointmentId: safeRow[5],
                    pickupTime: safeRow[6],
                    roundTrip: safeRow[7],
                    appointmentTime: safeRow[8],
                    providerLocation: safeRow[9],
                    status: safeRow[10],
                    notes: safeRow[11],
                    pickupLocation: safeRow[12],
                    driverId: safeRow[13], // Column N - Driver ID
                    driverName: safeRow[14],
                    driverPlate: safeRow[15],
                    driverCar: safeRow[16] // Column Q - Driver Car
                }
            })
            .filter(ride => 
                ride.orgId === orgId && 
                (ride.status === 'confirmed' || ride.status === 'pending') &&
                !ride.driverId // No driver claimed yet
            )

        console.log(`Found ${availableRides.length} available rides for driver ${driverId}`)
        res.json(availableRides)
    } catch (error) {
        console.error('Error fetching available rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/org/:orgId/drivers/:driverId/claim-ride - Claim a ride
router.post('/:orgId/drivers/:driverId/claim-ride', authenticateToken, async (req, res) => {
    try {
        const { orgId, driverId } = req.params
        const { rideId, rowIndex } = req.body
        
        if (!rideId || !rowIndex) {
            return res.status(400).json({ error: 'Ride ID and row index are required' })
        }
        
        // Verify driver exists and belongs to this org
        const driver = await getDriverById(driverId)
        if (!driver || driver.orgId !== orgId) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const sheets = getSheets()
        
        // Get current ride details to verify it's still available
        const rideResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}:Q${rowIndex}`,
        })

        const rideRow = rideResponse.data.values?.[0]
        if (!rideRow) {
            return res.status(404).json({ error: 'Ride not found' })
        }
        
        if (rideRow[0] !== orgId || rideRow[1] !== rideId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }
        
        // Check if ride is already claimed
        if (rideRow[13]) { // Column N - Driver ID
            return res.status(400).json({ error: 'Ride already claimed by another driver' })
        }
        
        // Check if ride status allows claiming
        const currentStatus = rideRow[10]
        if (!['confirmed', 'pending'].includes(currentStatus)) {
            return res.status(400).json({ error: `Cannot claim ride with status: ${currentStatus}` })
        }

        // Get existing pickup time from ride (calculated during creation)
        const existingPickupTime = rideRow[6] // Column G - pickup time
        const pickupLocation = rideRow[12] // Column M
        const providerLocation = rideRow[9] // Column J
        const appointmentTime = rideRow[8] // Column I

        // Update the ride with driver information (pickup time already calculated during creation)
        const updates = [
            {
                range: `${RIDES_SHEET}!K${rowIndex}`, // Status
                values: [['claimed']]
            },
            {
                range: `${RIDES_SHEET}!N${rowIndex}`, // Driver ID
                values: [[driverId]]
            },
            {
                range: `${RIDES_SHEET}!O${rowIndex}`, // Driver Name
                values: [[driver.name]]
            },
            {
                range: `${RIDES_SHEET}!P${rowIndex}`, // Driver License Plate
                values: [[driver.licensePlate]]
            },
            {
                range: `${RIDES_SHEET}!Q${rowIndex}`, // Driver Car
                values: [[`${driver.carMake} ${driver.carModel}`]]
            }
        ]

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: updates }
        })

        console.log(`Driver ${driverId} claimed ride ${rideId}`)
        res.json({ 
            success: true, 
            rideId, 
            driverId,
            driverName: driver.name,
            pickupTime: existingPickupTime, // Use existing pickup time from creation
            message: 'Ride claimed successfully' 
        })
    } catch (error) {
        console.error('Error claiming ride:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/drivers/:driverId/claimed-rides - Get rides claimed by a driver
router.get('/:orgId/drivers/:driverId/claimed-rides', authenticateToken, async (req, res) => {
    try {
        const { orgId, driverId } = req.params
        
        // Verify driver exists and belongs to this org
        const driver = await getDriverById(driverId)
        if (!driver || driver.orgId !== orgId) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const claimedRides = rows.slice(1)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 17) safeRow.push('') // Updated to 17 columns (A-Q)
                
                return {
                    rowIndex: index + 2,
                    orgId: safeRow[0],
                    id: safeRow[1],
                    patientName: safeRow[2],
                    patientId: safeRow[3],
                    appointmentDate: safeRow[4],
                    appointmentId: safeRow[5],
                    pickupTime: safeRow[6],
                    roundTrip: safeRow[7],
                    appointmentTime: safeRow[8],
                    providerLocation: safeRow[9],
                    status: safeRow[10],
                    notes: safeRow[11],
                    pickupLocation: safeRow[12],
                    driverId: safeRow[13], // Column N - Driver ID
                    driverName: safeRow[14],
                    driverPlate: safeRow[15],
                    driverCar: safeRow[16] // Column Q - Driver Car
                }
            })
            .filter(ride => 
                ride.orgId === orgId && 
                ride.driverId === driverId
            )

        console.log(`Found ${claimedRides.length} claimed rides for driver ${driverId}`)
        res.json(claimedRides)
    } catch (error) {
        console.error('Error fetching claimed rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// PATCH /api/org/:orgId/drivers/:driverId/rides/:rideId/status - Update ride status by driver
router.patch('/:orgId/drivers/:driverId/rides/:rideId/status', authenticateToken, async (req, res) => {
    try {
        const { orgId, driverId, rideId } = req.params
        const { status, rowIndex } = req.body
        
        if (!status || !rowIndex) {
            return res.status(400).json({ error: 'Status and row index are required' })
        }
        
        // Verify driver exists and belongs to this org
        const driver = await getDriverById(driverId)
        if (!driver || driver.orgId !== orgId) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const sheets = getSheets()
        
        // Get current ride details to verify driver owns this ride
        const rideResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}:Q${rowIndex}`,
        })

        const rideRow = rideResponse.data.values?.[0]
        if (!rideRow) {
            return res.status(404).json({ error: 'Ride not found' })
        }
        
        if (rideRow[0] !== orgId || rideRow[1] !== rideId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }
        
        // Verify this driver claimed this ride
        if (rideRow[13] !== driverId) { // Column N - Driver ID
            return res.status(403).json({ error: 'You can only update status of rides you have claimed' })
        }

        // Valid status transitions for drivers
        const validDriverStatuses = ['en route', 'in transit', 'arrived', 'completed']
        if (!validDriverStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Drivers can only set status to: ${validDriverStatuses.join(', ')}` 
            })
        }

        // Update ride status
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!K${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[status]] }
        })

        console.log(`Driver ${driverId} updated ride ${rideId} status to ${status}`)
        res.json({ 
            success: true, 
            rideId, 
            driverId,
            status, 
            message: 'Ride status updated successfully' 
        })
    } catch (error) {
        console.error('Error updating ride status:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/org/:orgId/drivers - Create a new driver account
router.post('/:orgId/drivers', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const { id, name, carMake, carModel, licensePlate } = req.body
        
        if (!id || !name || !carMake || !carModel || !licensePlate) {
            return res.status(400).json({ 
                error: 'Driver ID, name, car make, car model, and license plate are required' 
            })
        }

        // Check if driver ID already exists
        const existingDriver = await getDriverById(id)
        if (existingDriver) {
            return res.status(400).json({ error: 'Driver ID already exists' })
        }

        const sheets = getSheets()
        
        const newDriverRow = [
            orgId,               // A - Organization ID
            id,                  // B - Driver ID
            name,                // C - Driver Name
            carMake,             // D - Car Make
            carModel,            // E - Car Model
            licensePlate,        // F - License Plate
            'active'             // G - Status
        ]

        // Add driver to sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [newDriverRow]
            }
        })

        const driver = {
            id,
            name,
            carMake,
            carModel,
            licensePlate,
            status: 'active',
            createdAt: new Date().toISOString()
        }

        console.log(`Created driver ${id} for org ${orgId}`)
        res.status(201).json(driver)
    } catch (error) {
        console.error('Error creating driver:', error)
        res.status(500).json({ error: error.message })
    }
})

// PUT /api/org/:orgId/drivers/:driverId - Update driver information
router.put('/:orgId/drivers/:driverId', authenticateToken, async (req, res) => {
    try {
        const { orgId, driverId } = req.params
        const { name, carMake, carModel, licensePlate, status } = req.body
        
        // Verify driver exists and belongs to this org
        const driver = await getDriverById(driverId)
        if (!driver || driver.orgId !== orgId) {
            return res.status(403).json({ error: 'Access denied' })
        }

        // Find the driver's row
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })

        const rows = response.data.values || []
        let rowIndex = -1
        
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === orgId && rows[i][1] === driverId) {
                rowIndex = i + 1 // 1-based indexing for sheets
                break
            }
        }
        
        if (rowIndex === -1) {
            return res.status(404).json({ error: 'Driver not found' })
        }

        const updates = []
        if (name !== undefined) {
            updates.push({
                range: `${DRIVER_ACCOUNTS_SHEET}!C${rowIndex}`,
                values: [[name]]
            })
        }
        if (carMake !== undefined) {
            updates.push({
                range: `${DRIVER_ACCOUNTS_SHEET}!D${rowIndex}`,
                values: [[carMake]]
            })
        }
        if (carModel !== undefined) {
            updates.push({
                range: `${DRIVER_ACCOUNTS_SHEET}!E${rowIndex}`,
                values: [[carModel]]
            })
        }
        if (licensePlate !== undefined) {
            updates.push({
                range: `${DRIVER_ACCOUNTS_SHEET}!F${rowIndex}`,
                values: [[licensePlate]]
            })
        }
        if (status !== undefined) {
            updates.push({
                range: `${DRIVER_ACCOUNTS_SHEET}!G${rowIndex}`,
                values: [[status]]
            })
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' })
        }

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: updates }
        })

        console.log(`Updated driver ${driverId} for org ${orgId}`)
        res.json({ 
            success: true, 
            driverId,
            message: 'Driver updated successfully',
            updatedFields: { name, carMake, carModel, licensePlate, status }
        })
    } catch (error) {
        console.error('Error updating driver:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router