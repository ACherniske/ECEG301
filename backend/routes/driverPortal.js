import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, DRIVER_ACCOUNTS_SHEET, RIDES_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'
import { calculateRealDistance, calculateTotalRideDistance, getDistanceToDriver } from '../services/mapsService.js'
import { processRidesForDriver, getAcceptanceConfig } from '../services/rideAcceptanceService.js'

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

// GET /api/driver/rides - Get available rides for the driver with acceptance scoring
router.get('/rides', authenticateToken, requireDriverRole, async (req, res) => {
    try {
        const driverId = req.user.id
        
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        // Get driver's profile for acceptance scoring
        const driverResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })
        
        const driverRows = driverResponse.data.values || []
        let driverProfile = null
        
        for (let i = 1; i < driverRows.length; i++) {
            const driverRow = driverRows[i]
            if (driverRow[0] === driverId) {
                const safeDRow = [...driverRow]
                while (safeDRow.length < 11) safeDRow.push('')
                
                driverProfile = {
                    userId: safeDRow[0],
                    email: safeDRow[1],
                    firstName: safeDRow[2],
                    lastName: safeDRow[3],
                    address: safeDRow[7] || '',
                    driverMake: safeDRow[8] || '',
                    driverModel: safeDRow[9] || '',
                    licensePlate: safeDRow[10] || ''
                }
                break
            }
        }

        if (!driverProfile) {
            return res.status(404).json({ error: 'Driver profile not found' })
        }

        // Filter rides that are available for claiming (status: 'confirmed')
        const availableRides = rows.slice(1)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 21) safeRow.push('') // Extended to 21 columns
                
                return {
                    rowIndex: index + 2,
                    id: safeRow[1], // id for frontend compatibility
                    rideId: safeRow[1], // id (duplicate for backend compatibility)
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
                    driverCar: safeRow[16], // driverCar
                    dayOfWeek: safeRow[17], // DOTW
                    distanceToProvider: safeRow[18], // distance to provider
                    distanceToDriver: safeRow[19], // distance to driver
                    distanceTraveled: safeRow[20] // distance traveled
                }
            })
            .filter(ride => ride.status === 'confirmed') // Only confirmed rides available for claiming

        if (availableRides.length === 0) {
            console.log('No available rides found for driver')
            return res.json([])
        }

        // Apply ride acceptance scoring and sorting
        console.log(`🔄 Applying ride acceptance scoring for driver ${driverId}...`)
        const acceptanceConfig = getAcceptanceConfig()
        const processedResult = await processRidesForDriver(availableRides, driverProfile, acceptanceConfig)

        console.log(`✅ Processed ${processedResult.rides.length} rides with acceptance scoring`)
        console.log(`   📊 Summary: ${processedResult.summary.eligibleCount}/${processedResult.summary.totalCount} eligible, avg score: ${processedResult.summary.averageScore.toFixed(1)}`)

        res.json({
            rides: processedResult.rides,
            summary: processedResult.summary,
            driver: {
                id: driverProfile.userId,
                name: `${driverProfile.firstName} ${driverProfile.lastName}`,
                address: driverProfile.address
            },
            config: acceptanceConfig
        })
    } catch (error) {
        console.error('Error fetching available rides with acceptance scoring:', error)
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
                while (safeRow.length < 21) safeRow.push('') // Extended to 21 columns
                
                return {
                    rowIndex: index + 2,
                    id: safeRow[1], // id for frontend compatibility
                    rideId: safeRow[1], // id (duplicate for backend compatibility)
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
                    driverCar: safeRow[16], // driverCar
                    dayOfWeek: safeRow[17], // DOTW
                    distanceToProvider: safeRow[18], // distance to provider
                    distanceToDriver: safeRow[19], // distance to driver
                    distanceTraveled: safeRow[20] // distance traveled
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
                while (safeRow.length < 21) safeRow.push('') // Extended to 21 columns
                
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

        // Update the ride to claim it and calculate distances
        const now = new Date().toISOString()
        
        // Get driver profile to get driver address for distance calculation
        const driverResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })
        
        const driverRows = driverResponse.data.values || []
        let driverAddress = ''
        let driverName = ''
        let driverPlate = ''
        let driverCar = ''
        
        for (let i = 1; i < driverRows.length; i++) {
            const driverRow = driverRows[i]
            if (driverRow[0] === driverId) {
                const safeDRow = [...driverRow]
                while (safeDRow.length < 11) safeDRow.push('')
                
                driverAddress = safeDRow[7] || '' // address
                driverName = `${safeDRow[2]} ${safeDRow[3]}` || '' // firstName lastName
                driverPlate = safeDRow[10] || '' // licensePlate
                driverCar = `${safeDRow[8]} ${safeDRow[9]}`.trim() || '' // driverMake driverModel
                break
            }
        }
        
        // Get the ride data for calculations
        const rideRow = rows[rideRowIndex - 1]
        const safeRideRow = [...rideRow]
        while (safeRideRow.length < 21) safeRideRow.push('')
        
        const pickupLocation = safeRideRow[12] || '' // pickupLocation
        const providerLocation = safeRideRow[9] || '' // providerLocation
        const isRoundTrip = safeRideRow[7] === 'true' || safeRideRow[7] === true
        
        // Calculate actual distances using Google Maps API
        let distanceToDriver = '0 mi'
        let distanceTraveled = '0 mi'
        
        try {
            if (driverAddress && pickupLocation) {
                console.log(`Calculating distance to driver: ${pickupLocation} → ${driverAddress}`)
                const distanceResult = await calculateRealDistance(pickupLocation, driverAddress)
                distanceToDriver = distanceResult.distance
            }

            if (driverAddress && pickupLocation && providerLocation) {
                console.log(`Calculating total travel distance for ride: ${driverAddress} → ${pickupLocation} → ${providerLocation}${isRoundTrip ? ' → ' + pickupLocation : ''}`)
                const totalDistanceResult = await calculateTotalRideDistance(driverAddress, pickupLocation, providerLocation, isRoundTrip)
                distanceTraveled = totalDistanceResult.totalDistance
                
                console.log(`Calculated distances: To driver: ${distanceToDriver}, Total travel: ${distanceTraveled}`)
            }
        } catch (distanceError) {
            console.error('Error calculating distances:', distanceError)
            // Continue with fallback values
            distanceToDriver = '0 mi'
            distanceTraveled = '0 mi'
        }

        // Update the ride with claim information and calculated distances
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!K${rideRowIndex}:U${rideRowIndex}`, // status through distance traveled
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['claimed', '', '', driverId, driverName, driverPlate, driverCar, '', '', distanceToDriver, distanceTraveled]]
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
            while (safeRow.length < 21) safeRow.push('') // Extended to 21 columns
            if (safeRow[13]) { // driverId column
                foundDriverIds.add(safeRow[13])
            }
        }
        console.log(`Found drivers in sheet:`, Array.from(foundDriverIds))

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const safeRow = [...row]
            while (safeRow.length < 21) safeRow.push('') // Extended to 21 columns
            
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

// PATCH /api/driver/rides/:rideId/accept - Accept a ride (simplified version of claim)
router.patch('/rides/:rideId/accept', authenticateToken, requireDriverRole, async (req, res) => {
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
            if (row[1] === rideId) { // Column 1: id
                rideRowIndex = i + 1 // 1-based for sheets API
                const safeRow = [...row]
                while (safeRow.length < 21) safeRow.push('')
                
                rideData = {
                    appointmentTime: safeRow[8], // Column 8: appointment time
                    providerLocation: safeRow[9], // Column 9: provider location
                    status: safeRow[10], // Column 10: status
                    notes: safeRow[11], // Column 11: notes
                    pickupLocation: safeRow[12], // Column 12: pickup location
                    driverId: safeRow[13], // Column 13: driverId
                    pickupTime: safeRow[6], // Column 6: pickupTime (calculated during creation)
                    roundTrip: safeRow[7], // Column 7: round trip
                    dayOfWeek: safeRow[17], // Column 17: dayOfWeek (preserve existing)
                    distanceToProvider: safeRow[18] // Column 18: distanceToProvider (preserve existing)
                }
                break
            }
        }

        if (!rideData) {
            return res.status(404).json({ error: 'Ride not found' })
        }

        if (rideData.status !== 'confirmed') {
            return res.status(400).json({ error: 'Ride is not available for acceptance' })
        }

        if (rideData.driverId && rideData.driverId.trim() !== '') {
            return res.status(400).json({ error: 'Ride is already accepted by another driver' })
        }

        // Get driver profile for driver info
        const driverResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${DRIVER_ACCOUNTS_SHEET}!${RANGES.DRIVERS}`,
        })
        
        const driverRows = driverResponse.data.values || []
        let driverName = ''
        let driverPlate = ''
        let driverCar = ''
        let driverAddress = ''

        // Find driver info
        for (let i = 1; i < driverRows.length; i++) {
            const driverRow = driverRows[i]
            if (driverRow[0] === driverId) { // Column 0: userId
                driverName = `${driverRow[1] || ''} ${driverRow[2] || ''}`.trim() // firstName lastName
                driverPlate = driverRow[10] || '' // Column 10: licensePlate
                driverCar = `${driverRow[8] || ''} ${driverRow[9] || ''}`.trim() // carMake carModel
                driverAddress = driverRow[7] || '' // Column 7: address
                break
            }
        }

        // Calculate distance to driver if we have addresses
        let distanceToDriver = ''
        if (driverAddress && rideData.pickupLocation) {
            try {
                const { calculateRealDistance } = await import('../services/mapsService.js')
                const distanceResult = await calculateRealDistance(driverAddress, rideData.pickupLocation)
                if (distanceResult && distanceResult.distance !== null) {
                    distanceToDriver = distanceResult.distance.toString()
                }
            } catch (distanceError) {
                console.warn('Could not calculate distance to driver:', distanceError.message)
            }
        }

        // Update the ride with driver information and change status to claimed
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!K${rideRowIndex}:T${rideRowIndex}`, // status through distanceToDriver
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    'claimed',                    // Column K (10): status
                    rideData.notes || '',        // Column L (11): notes (preserve existing)
                    rideData.pickupLocation || '', // Column M (12): pickupLocation (preserve existing) 
                    driverId,                     // Column N (13): driverId
                    driverName,                   // Column O (14): driverName  
                    driverPlate,                  // Column P (15): driverPlate
                    driverCar,                    // Column Q (16): driverCar
                    rideData.dayOfWeek || '',     // Column R (17): dayOfWeek (preserve existing)
                    rideData.distanceToProvider || '', // Column S (18): distanceToProvider (preserve existing)
                    distanceToDriver              // Column T (19): distanceToDriver
                ]]
            }
        })

        console.log(`Driver ${driverId} (${driverName}) accepted ride ${rideId}`)
        res.json({ 
            success: true, 
            message: 'Ride accepted successfully',
            rideId,
            driverName,
            pickupTime: rideData.pickupTime, // Use existing pickup time from ride creation
            distanceToDriver
        })
    } catch (error) {
        console.error('Error accepting ride:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router
