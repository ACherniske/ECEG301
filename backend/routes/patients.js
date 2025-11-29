import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, PATIENTS_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/org/:orgId/ehr/patients/search
router.get('/:orgId/patients/search', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const { query } = req.query

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Search query is required' })
        }

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PATIENTS_SHEET}!${RANGES.PATIENTS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const searchLower = query.toLowerCase().trim()
        const results = rows.slice(1)
            .filter(row => {
                const safeRow = [...row]
                while (safeRow.length < 7) safeRow.push('')
                
                if (safeRow[0] !== orgId) return false
                
                const firstName = safeRow[2]?.toLowerCase() || ''
                const lastName = safeRow[3]?.toLowerCase() || ''
                const patientId = safeRow[1]?.toLowerCase() || ''
                const phone = safeRow[5]?.toLowerCase() || ''
                const fullName = `${firstName} ${lastName}`.toLowerCase()
                
                return patientId === searchLower || firstName.includes(searchLower) || 
                       lastName.includes(searchLower) || fullName.includes(searchLower) || 
                       phone.includes(searchLower)
            })
            .map(row => {
                const safeRow = [...row]
                while (safeRow.length < 7) safeRow.push('')
                
                return {
                    id: safeRow[1],
                    firstName: safeRow[2],
                    lastName: safeRow[3],
                    dateOfBirth: safeRow[4],
                    phone: safeRow[5],
                    address: safeRow[6],
                    email: safeRow[7]
                }
            })

        console.log(`Found ${results.length} patients for query: "${query}" in org ${orgId}`)
        res.json(results)
    } catch (error) {
        console.error('Error searching patients:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/org/:orgId/ehr/patients/:patientId
router.get('/:orgId/patients/:patientId', authenticateToken, async (req, res) => {
    try {
        const { orgId, patientId } = req.params

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PATIENTS_SHEET}!${RANGES.PATIENTS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' })

        const patientRow = rows.slice(1).find(row => row[0] === orgId && row[1] === patientId)
        if (!patientRow) return res.status(404).json({ error: 'Patient not found' })

        const patient = {
            id: patientRow[1],
            firstName: patientRow[2],
            lastName: patientRow[3],
            dateOfBirth: patientRow[4],
            phone: patientRow[5],
            address: patientRow[6],
            email: patientRow[7]
        }

        console.log(`Fetched patient ${patientId} for org ${orgId}`)
        res.json(patient)
    } catch (error) {
        console.error('Error fetching patient:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router