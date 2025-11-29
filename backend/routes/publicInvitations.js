import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { generateToken } from '../utils/jwtUtils.js'
import { hashPassword } from '../utils/passwordUtils.js'
import { organizationService } from '../services/organizationService.js'

const router = express.Router()
const INVITATIONS_SHEET = 'Invitations'

// GET /api/accept-invitation/:token - Get invitation details (public route)
router.get('/accept-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params
    const sheets = getSheets()

    console.log(`Loading invitation with token: ${token}`)

    // For now, treat token as invitation ID (in production, implement proper JWT)
    const invitationId = token

    // Find the invitation
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!${RANGES.INVITATIONS}`,
    })

    const rows = response.data.values || []
    console.log(`Found ${rows.length} rows in invitations sheet`)
    
    let invitationRow = null

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === invitationId) {
        invitationRow = rows[i]
        console.log(`Found invitation row:`, invitationRow)
        break
      }
    }

    if (!invitationRow) {
      console.log(`Invitation not found for token: ${token}`)
      return res.status(404).json({ error: 'Invitation not found' })
    }

    const invitation = {
      id: invitationRow[0],
      orgId: invitationRow[1],
      email: invitationRow[2],
      firstName: invitationRow[3],
      lastName: invitationRow[4],
      role: invitationRow[5],
      status: invitationRow[6],
      expiresAt: invitationRow[8],
      organizationName: 'Healthcare Organization' // TODO: Fetch actual org name
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      console.log(`Invitation status is ${invitation.status}, not pending`)
      return res.status(400).json({ error: 'Invitation is no longer valid' })
    }

    const expirationDate = new Date(invitation.expiresAt)
    if (expirationDate < new Date()) {
      console.log(`Invitation expired on ${invitation.expiresAt}`)
      return res.status(400).json({ error: 'Invitation has expired' })
    }

    // Get organization name
    let organizationName = 'Healthcare Organization'
    try {
      const org = await organizationService.getOrganization(invitation.orgId)
      if (org) {
        organizationName = org.name
      }
    } catch (error) {
      console.warn('Could not fetch organization name:', error.message)
    }

    invitation.organizationName = organizationName

    console.log(`Returning valid invitation for ${invitation.email}`)
    res.json(invitation)
  } catch (error) {
    console.error('Error getting invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/accept-invitation/:token - Complete invitation acceptance
router.post('/accept-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body
    const sheets = getSheets()

    console.log(`Accepting invitation with token: ${token}`)

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // For now, treat token as invitation ID
    const invitationId = token

    // Find and validate invitation
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!${RANGES.INVITATIONS}`,
    })

    const rows = response.data.values || []
    let invitationRow = null
    let rowIndex = null

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === invitationId) {
        invitationRow = rows[i]
        rowIndex = i + 1
        break
      }
    }

    if (!invitationRow) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    if (invitationRow[6] !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer valid' })
    }

    const expirationDate = new Date(invitationRow[8])
    if (expirationDate < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' })
    }

    // Create user account in ProviderAccounts sheet
    const existingUsersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const existingUsers = existingUsersResponse.data.values || []
    const orgUsers = existingUsers.slice(1).filter(row => row[0] === invitationRow[1])
    
    // Generate new user ID for this organization
    const existingUserIds = orgUsers
      .map(row => parseInt(row[1]))
      .filter(id => !isNaN(id))
    
    const newUserId = existingUserIds.length > 0 
      ? (Math.max(...existingUserIds) + 1).toString()
      : '1'

    // Hash the password before storing
    const hashedPassword = await hashPassword(password)

    // TODO: Hash password properly in production - now using bcrypt
    const userValues = [
      invitationRow[1], // orgId
      newUserId,
      invitationRow[2], // email
      invitationRow[3], // firstName
      invitationRow[4], // lastName
      invitationRow[5], // role
      'active',
      new Date().toISOString().split('T')[0], // createdAt
      hashedPassword // Store hashed password
    ]

    // Add user to ProviderAccounts sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [userValues]
      }
    })

    // Mark invitation as accepted
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${INVITATIONS_SHEET}!G${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['accepted']]
      }
    })

    const user = {
      id: newUserId,
      email: invitationRow[2],
      firstName: invitationRow[3],
      lastName: invitationRow[4],
      role: invitationRow[5],
      status: 'active',
      organizationId: invitationRow[1]
    }

    // Get organization data
    let organization = {
      id: invitationRow[1],
      name: 'Healthcare Organization',
      address: '',
      phone: '',
      email: '',
      status: 'active'
    }

    try {
      const org = await organizationService.getOrganization(invitationRow[1])
      if (org) {
        organization = org
      }
    } catch (error) {
      console.warn('Could not fetch organization data:', error.message)
    }

    // Generate JWT token
    const jwtToken = generateToken(user, organization)

    console.log(`Created user account for ${invitationRow[2]} in org ${invitationRow[1]}`)

    res.json({ 
      success: true,
      message: 'Account created successfully',
      user,
      organization,
      token: jwtToken
    })
  } catch (error) {
    console.error('Error completing invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router