// routes/invitations.js
import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'
import { emailService } from '../services/emailService.js'

const router = express.Router()
const INVITATIONS_SHEET = 'Invitations'

// GET /api/org/:orgId/invitations - Fetch all invitations for an org
router.get('/:orgId/invitations', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params
    const sheets = getSheets()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!${RANGES.INVITATIONS}`,
    })

    const rows = response.data.values || []
    
    if (rows.length === 0) {
      return res.json([])
    }

    // Skip header row
    const dataRows = rows.slice(1)
    
    // Convert rows to invitation objects and filter by orgId
    const invitations = dataRows.map((row, index) => {
      const safeRow = [...row]
      while (safeRow.length < 9) {
        safeRow.push('')
      }
      
      return {
        id: safeRow[0] || '',
        orgId: safeRow[1] || '',
        email: safeRow[2] || '',
        firstName: safeRow[3] || '',
        lastName: safeRow[4] || '',
        role: safeRow[5] || 'provider',
        status: safeRow[6] || 'pending',
        createdAt: safeRow[7] || '',
        expiresAt: safeRow[8] || '',
        rowIndex: index + 2
      }
    })
    .filter(inv => inv.email && inv.orgId === orgId && inv.status === 'pending')

    console.log(`Fetched ${invitations.length} invitations for org ${orgId}`)
    res.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/org/:orgId/invitations - Create a new invitation
router.post('/:orgId/invitations', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params
    const { email, firstName, lastName, role } = req.body
    const sheets = getSheets()

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, first name, and last name are required' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate role
    const validRoles = ['provider', 'staff', 'admin', 'dev']
    const selectedRole = role || 'provider'
    if (!validRoles.includes(selectedRole)) {
      return res.status(400).json({ error: 'Invalid role specified' })
    }

    // Check if user already exists in ProviderAccounts
    const existingUsers = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const userExists = existingUsers.data.values?.slice(1).some(row => 
      row[0] === orgId && row[2]?.toLowerCase() === email.toLowerCase()
    )

    if (userExists) {
      return res.status(409).json({ 
        error: 'A user with this email already exists in the organization' 
      })
    }

    // Check if invitation already exists for this email in this org
    const existingInvitations = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!${RANGES.INVITATIONS}`,
    })

    const existingRows = existingInvitations.data.values || []
    const duplicate = existingRows.slice(1).some(row => {
      return row[1] === orgId && row[2]?.toLowerCase() === email.toLowerCase() && row[6] === 'pending'
    })

    if (duplicate) {
      return res.status(409).json({ 
        error: 'An active invitation already exists for this email' 
      })
    }

    // Generate invitation ID
    const existingIds = existingRows
      .slice(1)
      .map(row => parseInt(row[0]))
      .filter(id => !isNaN(id))
    
    const newId = existingIds.length > 0 
      ? (Math.max(...existingIds) + 1).toString()
      : '1'

    // Set creation and expiration dates
    const createdAt = new Date().toISOString().split('T')[0]
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      .toISOString().split('T')[0]

    // Prepare invitation data
    const values = [
      newId,
      orgId,
      email.toLowerCase().trim(),
      firstName.trim(),
      lastName.trim(),
      selectedRole,
      'pending',
      createdAt,
      expiresAt
    ]

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!${RANGES.INVITATIONS}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values]
      }
    })

    const invitation = {
      id: newId,
      orgId,
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: selectedRole,
      status: 'pending',
      createdAt,
      expiresAt
    }

    // Send invitation email
    try {
      // Get organization name (for now using a default, you might want to fetch from sheets)
      const organizationName = 'Healthcare Organization' // TODO: Fetch from organization data
      
      await emailService.sendInvitationEmail(invitation, organizationName)
      console.log(`Invitation email sent to ${email}`)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the whole request if email fails
      // You might want to set a flag or retry later
    }

    console.log(`Created invitation ${newId} for ${email} in org ${orgId} with role ${selectedRole}`)

    res.status(201).json(invitation)
  } catch (error) {
    console.error('Error creating invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/org/:orgId/invitations/:invitationId - Revoke an invitation
router.delete('/:orgId/invitations/:invitationId', authenticateToken, async (req, res) => {
  try {
    const { orgId, invitationId } = req.params
    const sheets = getSheets()

    // Find the invitation
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!${RANGES.INVITATIONS}`,
    })

    const rows = response.data.values || []
    let invitationRow = null
    let rowIndex = null

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === invitationId && rows[i][1] === orgId) {
        invitationRow = rows[i]
        rowIndex = i + 1 // +1 for 1-based indexing
        break
      }
    }

    if (!invitationRow) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    // Update status to 'revoked' instead of deleting
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!G${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['revoked']]
      }
    })

    console.log(`Revoked invitation ${invitationId} for org ${orgId}`)
    res.json({ success: true, id: invitationId })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router