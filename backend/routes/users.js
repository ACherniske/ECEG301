import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, PROVIDER_ACCOUNTS_SHEET, RANGES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/org/:orgId/users - Get all users for an organization
router.get('/:orgId/users', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const sheets = getSheets()

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        // Filter users by organization
        const users = rows.slice(1)
            .filter(row => row[0] === orgId) // Column A = OrgId
            .map((row, index) => {
                const safeRow = [...row]
                while (safeRow.length < 8) safeRow.push('')
                
                return {
                    id: safeRow[1], // Column B = UserId
                    email: safeRow[2], // Column C = Email
                    firstName: safeRow[3], // Column D = FirstName
                    lastName: safeRow[4], // Column E = LastName
                    role: safeRow[5] || 'provider', // Column F = Role
                    status: safeRow[6] || 'active', // Column G = Status
                    createdAt: safeRow[7] || '', // Column H = CreatedAt
                    rowIndex: index + 2
                }
            })
            .filter(user => user.email && user.status === 'active')

        console.log(`Fetched ${users.length} users for org ${orgId}`)
        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: error.message })
    }
})

// DELETE /api/org/:orgId/users/:userId - Deactivate a user
router.delete('/:orgId/users/:userId', authenticateToken, async (req, res) => {
    try {
        const { orgId, userId } = req.params
        const sheets = getSheets()

        // Find the user
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
        })

        const rows = response.data.values || []
        let userRow = null
        let rowIndex = null

        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === orgId && rows[i][1] === userId) {
                userRow = rows[i]
                rowIndex = i + 1
                break
            }
        }

        if (!userRow) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Update status to 'inactive' instead of deleting
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!G${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [['inactive']]
            }
        })

        console.log(`Deactivated user ${userId} in org ${orgId}`)
        res.json({ success: true, userId })
    } catch (error) {
        console.error('Error deactivating user:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/org/:orgId/users - Create a new user (for invitation acceptance)
router.post('/:orgId/users', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const { email, firstName, lastName, role, password } = req.body
        const sheets = getSheets()

        // Validate required fields
        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({ 
                error: 'Email, first name, last name, and password are required' 
            })
        }

        // Check if user already exists
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
        })

        const rows = response.data.values || []
        const existingUser = rows.slice(1).find(row => 
            row[0] === orgId && row[2] === email.toLowerCase()
        )

        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' })
        }

        // Generate user ID
        const existingIds = rows
            .slice(1)
            .filter(row => row[0] === orgId)
            .map(row => parseInt(row[1]))
            .filter(id => !isNaN(id))
        
        const newUserId = existingIds.length > 0 
            ? (Math.max(...existingIds) + 1).toString()
            : '1'

        // TODO: Hash password properly in production
        const hashedPassword = password // Simplified for now

        const values = [
            orgId, // A
            newUserId, // B
            email.toLowerCase().trim(), // C
            firstName.trim(), // D
            lastName.trim(), // E
            role || 'provider', // F
            'active', // G
            new Date().toISOString().split('T')[0] // H
        ]

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [values]
            }
        })

        const user = {
            id: newUserId,
            email: email.toLowerCase().trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: role || 'provider',
            status: 'active'
        }

        console.log(`Created user ${newUserId} for org ${orgId}`)
        res.status(201).json(user)
    } catch (error) {
        console.error('Error creating user:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router