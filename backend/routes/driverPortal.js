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
                while (safeRow.length < 10) safeRow.push('')
                
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
                    driverModel: safeRow[9]
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
                    rideId: safeRow[0],
                    patientId: safeRow[1],
                    appointmentId: safeRow[2],
                    pickup: {
                        address: safeRow[3],
                        datetime: safeRow[4],
                        notes: safeRow[5]
                    },
                    destination: {
                        address: safeRow[6],
                        datetime: safeRow[7],
                        notes: safeRow[8]
                    },
                    status: safeRow[9],
                    driverId: safeRow[10],
                    createdAt: safeRow[11],
                    updatedAt: safeRow[12],
                    distance: safeRow[13],
                    estimatedDuration: safeRow[14],
                    patientNotes: safeRow[15],
                    internalNotes: safeRow[16]
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
                    rideId: safeRow[0],
                    patientId: safeRow[1],
                    appointmentId: safeRow[2],
                    pickup: {
                        address: safeRow[3],
                        datetime: safeRow[4],
                        notes: safeRow[5]
                    },
                    destination: {
                        address: safeRow[6],
                        datetime: safeRow[7],
                        notes: safeRow[8]
                    },
                    status: safeRow[9],
                    driverId: safeRow[10],
                    createdAt: safeRow[11],
                    updatedAt: safeRow[12],
                    distance: safeRow[13],
                    estimatedDuration: safeRow[14],
                    patientNotes: safeRow[15],
                    internalNotes: safeRow[16]
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
            if (row[0] === rideId) {
                rideRowIndex = i + 1 // 1-based for sheets API
                const safeRow = [...row]
                while (safeRow.length < 17) safeRow.push('')
                
                rideData = {
                    status: safeRow[9],
                    driverId: safeRow[10]
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
            range: `${RIDES_SHEET}!J${rideRowIndex}:M${rideRowIndex}`, // status, driverId, createdAt, updatedAt
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['claimed', driverId, '', now]]
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
            if (row[0] === rideId && row[10] === driverId) {
                rideRowIndex = i + 1 // 1-based for sheets API
                break
            }
        }

        if (rideRowIndex === -1) {
            return res.status(404).json({ error: 'Ride not found or not assigned to this driver' })
        }

        // Update the ride status
        const now = new Date().toISOString()
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!J${rideRowIndex}:M${rideRowIndex}`, // status, driverId, createdAt, updatedAt
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[status, driverId, '', now]]
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
