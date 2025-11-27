import express from 'express'
import { organizationService } from '../services/organizationService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/organizations - Get all organizations (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Check if user has admin role
    const organizations = await organizationService.getAllOrganizations()
    res.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/organizations/:orgId - Get specific organization
router.get('/:orgId', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params
    const organization = await organizationService.getOrganization(orgId)
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' })
    }
    
    res.json(organization)
  } catch (error) {
    console.error('Error fetching organization:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/organizations - Create new organization (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Check if user has admin role
    const { name, address, phone, email } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' })
    }
    
    const organization = await organizationService.createOrganization({
      name,
      address,
      phone,
      email
    })
    
    res.status(201).json(organization)
  } catch (error) {
    console.error('Error creating organization:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router