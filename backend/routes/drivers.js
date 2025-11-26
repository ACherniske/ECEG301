import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, DRIVER_ACCOUNTS_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/org/:orgId/drivers
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
            .filter(row => row[0] === orgId)
            .map(row => {
                const safeRow = [...row]
                while (safeRow.length < 6) safeRow.push('')
                
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

export default router