import express from 'express'
import { organizationService } from '../services/organizationService.js'
import { userService } from '../services/userService.js'
import { generateToken, verifyToken, extractTokenFromHeader } from '../utils/jwtUtils.js'
import { comparePassword, hashPassword } from '../utils/passwordUtils.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/login - Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Verify user credentials using the user service
    const user = await userService.verifyUserCredentials(email, password)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Fetch organization data
    let organization
    try {
      organization = await organizationService.getOrganization(user.organizationId)
      
      if (!organization) {
        console.warn(`Organization ${user.organizationId} not found, using fallback`)
        organization = {
          id: user.organizationId,
          name: 'Healthcare Organization',
          address: '',
          phone: '',
          email: '',
          status: 'active'
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
      organization = {
        id: user.organizationId,
        name: 'Healthcare Organization',
        address: '',
        phone: '',
        email: '',
        status: 'active'
      }
    }

    console.log(`User ${email} from organization ${organization.name} logged in successfully`)

    // Generate JWT token
    const token = generateToken(user, organization)

    res.json({
      success: true,
      message: 'Login successful',
      user,
      organization,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout - Logout (for now just a placeholder)
router.post('/logout', authenticateToken, (req, res) => {
  // With stateless JWT tokens, logout is typically handled client-side
  // by removing the token from storage. For additional security, you could
  // implement a token blacklist here.
  res.json({ success: true, message: 'Logged out successfully' })
})

// GET /api/auth/me - Get current user info (requires token)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get user with organization data using the service
    const userWithOrg = await userService.getUserWithOrganization(req.user.id)
    
    if (!userWithOrg) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(userWithOrg)
  } catch (error) {
    console.error('Auth me error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = req.user

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' })
    }

    // Verify current password
    const userData = await userService.verifyUserCredentials(user.email, currentPassword)
    if (!userData) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Update password using user service
    await userService.updatePassword(user.id, newPassword)

    console.log(`Password changed successfully for user ${user.email}`)
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/verify-token - Verify if a token is still valid
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    const decoded = verifyToken(token)
    res.json({ 
      valid: true, 
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId
      }
    })
  } catch (error) {
    res.json({ 
      valid: false, 
      error: error.message 
    })
  }
})

export default router