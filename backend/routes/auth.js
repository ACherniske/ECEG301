import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { organizationService } from '../services/organizationService.js'

const router = express.Router()

// POST /api/auth/login - Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const sheets = getSheets()
    
    // Get all users from ProviderAccounts sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    
    if (rows.length <= 1) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Find user by email
    let userRow = null
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row[2]?.toLowerCase() === email.toLowerCase() && row[6] === 'active') {
        userRow = row
        break
      }
    }

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // TODO: In production, implement proper password hashing and verification
    // For now, we'll use a simple check or accept any password for development
    // if (userRow[8] !== hashedPassword) {
    //   return res.status(401).json({ error: 'Invalid credentials' })
    // }

    const user = {
      id: userRow[1],
      email: userRow[2],
      firstName: userRow[3],
      lastName: userRow[4],
      role: userRow[5],
      status: userRow[6]
    }

    // Fetch organization data using the service
    let organization
    try {
      const orgId = userRow[0] // Organization ID from user row
      organization = await organizationService.getOrganization(orgId)
      
      if (!organization) {
        // Fallback if organization not found
        console.warn(`Organization ${orgId} not found, using fallback`)
        organization = {
          id: orgId,
          name: 'Healthcare Organization',
          address: '',
          phone: '',
          email: '',
          status: 'active'
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
      // Fallback organization data
      organization = {
        id: userRow[0],
        name: 'Healthcare Organization',
        address: '',
        phone: '',
        email: '',
        status: 'active'
      }
    }

    console.log(`User ${email} from organization ${organization.name} logged in successfully`)

    res.json({
      success: true,
      message: 'Login successful',
      user,
      organization,
      token: 'dev-token' // TODO: Generate actual JWT token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout - Logout (for now just a placeholder)
router.post('/logout', (req, res) => {
  // TODO: Implement token invalidation if using JWTs
  res.json({ success: true, message: 'Logged out successfully' })
})

// GET /api/auth/me - Get current user info (requires token)
router.get('/me', async (req, res) => {
  try {
    // TODO: Implement proper token verification
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token || token !== 'dev-token') {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // For development, return mock user data with real organization lookup
    // In production, decode JWT and fetch user from database
    try {
      const organization = await organizationService.getOrganization('org1')
      
      res.json({
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'provider'
        },
        organization: organization || {
          id: 'org1',
          name: 'Healthcare Organization',
          address: '',
          phone: '',
          email: '',
          status: 'active'
        }
      })
    } catch (error) {
      console.error('Error in /me endpoint:', error)
      // Fallback response
      res.json({
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'provider'
        },
        organization: {
          id: 'org1',
          name: 'Healthcare Organization',
          address: '',
          phone: '',
          email: '',
          status: 'active'
        }
      })
    }
  } catch (error) {
    console.error('Auth me error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router