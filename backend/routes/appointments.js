import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, APPOINTMENTS_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/org/:orgId/patients/:patientId/appointments
router.get('/:orgId/patients/:patientId/appointments', authenticateToken, async (req, res) => {
    try {
        const { orgId, patientId } = req.params
        console.log(`Fetching appointments for patient ${patientId} in org ${orgId}`)
        
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!${RANGES.APPOINTMENTS}`,
        })

        const rows = response.data.values || []
        if (rows.length <= 1) {
            console.log('No appointment data found')
            return res.json([])
        }

        const appointments = rows.slice(1)
            .filter(row => row[0] === orgId && row[1] === patientId) // Filter by org and patient
            .map(row => ({
                id: row[2] || '',
                appointmentType: row[3] || '',
                appointmentDate: row[4] || '',
                appointmentTime: row[5] || '',
                location: row[6] || '',
                providerName: row[7] || ''
            }))
            .filter(apt => apt.appointmentDate) // Only include appointments with dates

        console.log(`Found ${appointments.length} appointments for patient ${patientId}`)
        res.json(appointments)
    } catch (error) {
        console.error('Error fetching appointments:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router