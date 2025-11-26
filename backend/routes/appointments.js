import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, APPOINTMENTS_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/org/:orgId/ehr/patients/:patientId/appointments
router.get('/:orgId/patients/:patientId/appointments', authenticateToken, async (req, res) => {
    try {
        const { orgId, patientId } = req.params

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!${RANGES.APPOINTMENTS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const appointments = rows.slice(1)
            .filter(row => row[0] === orgId && row[1] === patientId)
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 8) safeRow.push('')
                
                return {
                    id: safeRow[2],
                    appointmentType: safeRow[3],
                    appointmentDate: safeRow[4],
                    appointmentTime: safeRow[5],
                    location: safeRow[6],
                    providerName: safeRow[7],
                    status: 'scheduled',
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

export default router