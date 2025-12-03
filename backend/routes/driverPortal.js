import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, DRIVER_ACCOUNTS_SHEET, RIDES_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Middleware to ensure user is a driver
const requireDriverRole = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    
    if (req.user.role !== 'driver') {
        return res.status(403).json({ 
            error: 'Access denied', 
            message: 'Driver access required'
        })
    }
    
    next()
}

// GET /api/driver/profile - Get current driver's profile
router.get('/profile', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const driverId = req.user.id // JWT contains userId as id
        
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Driver profile not found' })
        }

        // Find driver by userId (column A)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row[0] === driverId) {
                const safeRow = [...row]
                while (safeRow.length < 11) safeRow.push('')
                
                const driver = {
                    userId: safeRow[0],
                    email: safeRow[1],
                    firstName: safeRow[2],
                    lastName: safeRow[3],
                    status: safeRow[4] || 'active',
                    createdAt: safeRow[5],
                    // Don't return password for security
                    address: safeRow[7],
                    driverMake: safeRow[8],
                    driverModel: safeRow[9],
                    licensePlate: safeRow[10]
                }
                
                return res.json(driver)
            }
        }
        
        res.status(404).json({ error: 'Driver profile not found' })
    } catch (error) {
        console.error('Error fetching driver profile:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/driver/rides - Get available rides for the driver
router.get('/rides', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        // Filter rides that are available for claiming (status: 'confirmed')
        const availableRides = rows.slice(1)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 17) safeRow.push('')
                
                return {
                    rowIndex: index + 2,
                    rideId: safeRow[1], // id
                    orgId: safeRow[0], // orgId
                    patientName: safeRow[2], // patientName
                    patientId: safeRow[3], // patientId
                    appointmentDate: safeRow[4], // appointmentDate
                    appointmentId: safeRow[5], // appointmentId
                    pickupTime: safeRow[6], // pickupTime
                    roundTrip: safeRow[7], // roundTrip
                    appointmentTime: safeRow[8], // appointmentTime
                    providerLocation: safeRow[9], // providerLocation (destination)
                    status: safeRow[10], // status
                    notes: safeRow[11], // notes
                    pickupLocation: safeRow[12], // pickupLocation (pickup address)
                    driverId: safeRow[13], // driverId
                    driverName: safeRow[14], // driverName
                    driverPlate: safeRow[15], // driverPlate
                    driverCar: safeRow[16] // driverCar
                }
            })
            .filter(ride => ride.status === 'confirmed') // Only confirmed rides available for claiming

        console.log(`Fetched ${availableRides.length} available rides for driver`)
        res.json(availableRides)
    } catch (error) {
        console.error('Error fetching available rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/driver/rides/my - Get rides assigned to the current driver
router.get('/rides/my', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const driverId = req.user.id
        
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        // Filter rides assigned to this driver
        const myRides = rows.slice(1)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 17) safeRow.push('')
                
                return {
                    rowIndex: index + 2,
                    rideId: safeRow[1], // id
                    orgId: safeRow[0], // orgId
                    patientName: safeRow[2], // patientName
                    patientId: safeRow[3], // patientId
                    appointmentDate: safeRow[4], // appointmentDate
                    appointmentId: safeRow[5], // appointmentId
                    pickupTime: safeRow[6], // pickupTime
                    roundTrip: safeRow[7], // roundTrip
                    appointmentTime: safeRow[8], // appointmentTime
                    providerLocation: safeRow[9], // providerLocation (destination)
                    status: safeRow[10], // status
                    notes: safeRow[11], // notes
                    pickupLocation: safeRow[12], // pickupLocation (pickup address)
                    driverId: safeRow[13], // driverId
                    driverName: safeRow[14], // driverName
                    driverPlate: safeRow[15], // driverPlate
                    driverCar: safeRow[16] // driverCar
                }
            })
            .filter(ride => ride.driverId === driverId)

        console.log(`Fetched ${myRides.length} rides for driver ${driverId}`)
        res.json(myRides)
    } catch (error) {
        console.error('Error fetching driver rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/driver/rides/:rideId/claim - Claim a ride
router.post('/rides/:rideId/claim', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const { rideId } = req.params
        const driverId = req.user.id
        
        const sheets = getSheets()
        
        // First, get the current ride data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ride not found' })
        }

        // Find the ride and check if it's available
        let rideRowIndex = -1
        let rideData = null
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row[1] === rideId) { // Column 1: id (not column 0)
                rideRowIndex = i + 1 // 1-based for sheets API
                const safeRow = [...row]
                while (safeRow.length < 17) safeRow.push('')
                
                rideData = {
                    status: safeRow[10], // Column 10: status
                    driverId: safeRow[13] // Column 13: driverId
                }
                break
            }
        }

        if (!rideData) {
            return res.status(404).json({ error: 'Ride not found' })
        }

        if (rideData.status !== 'confirmed') {
            return res.status(400).json({ error: 'Ride is not available for claiming' })
        }

        if (rideData.driverId && rideData.driverId.trim() !== '') {
            return res.status(400).json({ error: 'Ride is already claimed by another driver' })
        }

        // Update the ride to claim it
        const now = new Date().toISOString()
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!K${rideRowIndex}:N${rideRowIndex}`, // status, notes, pickupLocation, driverId
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['claimed', '', '', driverId]]
            }
        })

        console.log(`Driver ${driverId} claimed ride ${rideId}`)
        res.json({ 
            success: true, 
            message: 'Ride claimed successfully',
            rideId,
            status: 'claimed'
        })
    } catch (error) {
        console.error('Error claiming ride:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/driver/statistics - Get driver statistics from rides
router.get('/statistics', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const driverId = req.user.id
        
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) {
            return res.json({
                totalRides: 0,
                completedRides: 0,
                completionRate: 0
            })
        }

        // Filter rides assigned to this driver and count statistics
        let totalRides = 0
        let completedRides = 0

        console.log(`Checking rides for driver ${driverId}...`)
        console.log(`Total rows found: ${rows.length}`)

        // Debug: Show all unique driver IDs in the sheet
        const foundDriverIds = new Set()
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const safeRow = [...row]
            while (safeRow.length < 17) safeRow.push('')
            if (safeRow[13]) { // driverId column
                foundDriverIds.add(safeRow[13])
            }
        }
        console.log(`Found drivers in sheet:`, Array.from(foundDriverIds))

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const safeRow = [...row]
            while (safeRow.length < 17) safeRow.push('')
            
            // Check if this ride is assigned to the current driver
            // Based on actual sheet structure: driverId is in column 13, status is in column 10
            if (safeRow[13] === driverId) { // Column 13: driverId
                totalRides++
                console.log(`✓ Found ride for driver: ${safeRow[1]} (status: ${safeRow[10]})`)
                
                // Check if ride is completed (status: 'completed')
                if (safeRow[10] === 'completed') { // Column 10: status
                    completedRides++
                    console.log(`✓ Completed ride: ${safeRow[1]}`)
                }
            }
        }

        const completionRate = totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0

        const statistics = {
            totalRides,
            completedRides,
            completionRate
        }

        console.log(`Driver ${driverId} statistics: ${JSON.stringify(statistics)}`)
        res.json(statistics)
    } catch (error) {
        console.error('Error fetching driver statistics:', error)
        res.status(500).json({ error: error.message })
    }
})

// PUT /api/driver/profile - Update driver profile
router.put('/profile', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const driverId = req.user.id
        const { firstName, lastName, address, driverMake, driverModel, licensePlate } = req.body

        const sheets = getSheets()
        
        // First, find the driver row
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })

        const rows = response.data.values || []
        let driverRowIndex = -1
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row[0] === driverId) {
                driverRowIndex = i + 1 // 1-based for sheets API
                break
            }
        }

        if (driverRowIndex === -1) {
            return res.status(404).json({ error: 'Driver profile not found' })
        }

        // Get current row data
        const currentRow = rows[driverRowIndex - 1]
        const safeRow = [...currentRow]
        while (safeRow.length < 11) safeRow.push('')

        // Update only provided fields
        const updatedRow = [
            safeRow[0], // userId (unchanged)
            safeRow[1], // email (unchanged)
            firstName || safeRow[2], // firstName
            lastName || safeRow[3], // lastName
            safeRow[4], // status (unchanged)
            safeRow[5], // createdAt (unchanged)
            safeRow[6], // password (unchanged)
            address || safeRow[7], // address
            driverMake !== undefined ? driverMake : safeRow[8], // driverMake
            driverModel !== undefined ? driverModel : safeRow[9], // driverModel
            licensePlate !== undefined ? licensePlate : safeRow[10] // licensePlate
        ]

        // Update the driver profile
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!A${driverRowIndex}:K${driverRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow]
            }
        })

        // Return updated profile (excluding password)
        const updatedProfile = {
            userId: updatedRow[0],
            email: updatedRow[1],
            firstName: updatedRow[2],
            lastName: updatedRow[3],
            status: updatedRow[4],
            createdAt: updatedRow[5],
            address: updatedRow[7],
            driverMake: updatedRow[8],
            driverModel: updatedRow[9],
            licensePlate: updatedRow[10]
        }

        console.log(`Driver ${driverId} updated their profile`)
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            driver: updatedProfile
        })
    } catch (error) {
        console.error('Error updating driver profile:', error)
        res.status(500).json({ error: error.message })
    }
})

// PUT /api/driver/rides/:rideId/status - Update ride status
router.put('/rides/:rideId/status', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const { rideId } = req.params
        const { status } = req.body
        const driverId = req.user.id

        if (!status) {
            return res.status(400).json({ error: 'Status is required' })
        }

        const validStatuses = ['claimed', 'en route', 'in transit', 'arrived', 'completed', 'cancelled']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' })
        }
        
        const sheets = getSheets()
        
        // First, verify the driver owns this ride
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        let rideRowIndex = -1
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row[1] === rideId && row[13] === driverId) { // Column 1: id, Column 13: driverId
                rideRowIndex = i + 1 // 1-based for sheets API
                break
            }
        }

        if (rideRowIndex === -1) {
            return res.status(404).json({ error: 'Ride not found or not assigned to this driver' })
        }

        // Update the ride status (Column K = 11th column in spreadsheet)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!K${rideRowIndex}`, // status column only
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[status]]
            }
        })

        console.log(`Driver ${driverId} updated ride ${rideId} status to ${status}`)
        res.json({ 
            success: true, 
            message: 'Ride status updated successfully',
            rideId,
            status
        })
    } catch (error) {
        console.error('Error updating ride status:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router
