import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RIDES_SHEET, RANGES, VALID_STATUSES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/org/:orgId/rides
router.get('/:orgId/rides', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const sheets = getSheets()

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const dataRows = rows.slice(1)
        const rides = dataRows.map((row, index) => {
            const safeRow = [...row]
            while (safeRow.length < 14) safeRow.push('')
            
            return {
                orgId: safeRow[0] || '',
                id: safeRow[1] || (index + 1).toString(),
                patientName: safeRow[2] || '',
                patientId: safeRow[3] || '',
                appointmentDate: safeRow[4] || '',
                pickupTime: safeRow[5] || '',
                appointmentTime: safeRow[6] || '',
                providerLocation: safeRow[7] || '',
                status: safeRow[8] || 'pending',
                notes: safeRow[9] || '',
                pickupLocation: safeRow[10] || '',
                driverName: safeRow[11] || '',
                driverPlate: safeRow[12] || '',
                driverCar: safeRow[13] || '',
                rowIndex: index + 2
            }
        }).filter(ride => ride.patientName && ride.orgId === orgId)

        console.log(`Fetched ${rides.length} rides for org ${orgId}`)
        res.json(rides)
    } catch (error) {
        console.error('Error fetching rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// PATCH /api/org/:orgId/rides/:rideId/status
router.patch('/:orgId/rides/:rideId/status', authenticateToken, async (req, res) => {
    try {
        const { orgId, rideId } = req.params
        const { status, rowIndex } = req.body
        
        if (!status) return res.status(400).json({ error: 'Status is required' })
        if (!rowIndex) return res.status(400).json({ error: 'Row index is required' })
        if (!VALID_STATUSES.includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status value' })
        }

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}`,
        })

        const rideOrgId = response.data.values?.[0]?.[0]
        if (rideOrgId !== orgId) return res.status(403).json({ error: 'Access denied to this ride' })

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!I${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[status]] }
        })

        console.log(`Updated ride ${rideId} status to ${status} for org ${orgId}`)
        res.json({ success: true, rideId, status, rowIndex })
    } catch (error) {
        console.error('Error updating ride status:', error)
        res.status(500).json({ error: error.message })
    }
})

// PATCH /api/org/:orgId/rides/:rideId
router.patch('/:orgId/rides/:rideId', authenticateToken, async (req, res) => {
    try {
        const { orgId, rideId } = req.params
        const { pickupTime, appointmentTime, providerLocation, notes, pickupLocation, driverName, driverPlate, driverCar, rowIndex } = req.body
        
        if (!rowIndex) return res.status(400).json({ error: 'Row index is required' })

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}:N${rowIndex}`,
        })

        const rideRow = response.data.values?.[0]
        if (!rideRow || rideRow[0] !== orgId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }

        const updates = []
        const fieldMappings = [
            { field: 'pickupTime', column: 'F' },
            { field: 'appointmentTime', column: 'G' },
            { field: 'providerLocation', column: 'H' },
            { field: 'notes', column: 'J' },
            { field: 'pickupLocation', column: 'K' },
            { field: 'driverName', column: 'L' },
            { field: 'driverPlate', column: 'M' },
            { field: 'driverCar', column: 'N' }
        ]

        fieldMappings.forEach(({ field, column }) => {
            if (req.body[field] !== undefined) {
                updates.push({
                    range: `${RIDES_SHEET}!${column}${rowIndex}`,
                    values: [[req.body[field]]]
                })
            }
        })

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: updates }
        })

        console.log(`Updated ride ${rideId} fields for org ${orgId}`)
        res.json({ success: true, rideId, updatedFields: req.body, rowIndex })
    } catch (error) {
        console.error('Error updating ride:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/org/:orgId/rides
router.post('/:orgId/rides', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const ride = req.body
        
        if (!ride.patientName || !ride.patientId) {
            return res.status(400).json({ error: 'Patient name and ID are required' })
        }

        const sheets = getSheets()
        if (!ride.id) {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${RIDES_SHEET}!A:B`,
            })
            
            const orgRides = (response.data.values || [])
                .slice(1)
                .filter(row => row[0] === orgId)
                .map(row => parseInt(row[1]))
                .filter(id => !isNaN(id))
            
            ride.id = orgRides.length > 0 ? (Math.max(...orgRides) + 1).toString() : '1'
        }

        const values = [
            orgId,
            ride.id,
            ride.patientName,
            ride.patientId,
            ride.appointmentDate || new Date().toISOString().split('T')[0],
            ride.pickupTime || '',
            ride.appointmentTime || '',
            ride.providerLocation || ride.appointmentLocation || '',
            ride.status || 'pending',
            ride.notes || '',
            ride.pickupLocation || '',
            ride.driverName || '',
            ride.driverPlate || '',
            ride.driverCar || ''
        ]

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [values] }
        })

        console.log(`Added new ride ${ride.id} for org ${orgId}`)
        res.status(201).json({ success: true, ride: { orgId, ...ride, id: ride.id } })
    } catch (error) {
        console.error('Error adding ride:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router
