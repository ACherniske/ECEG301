import express from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// TODO: Implement with actual data source
router.get('/:orgId/invitations', authenticateToken, async (req, res) => {
    res.json([])
})

router.post('/:orgId/invitations', authenticateToken, async (req, res) => {
    res.status(201).json({ id: Date.now().toString(), ...req.body })
})

router.delete('/:orgId/invitations/:invitationId', authenticateToken, async (req, res) => {
    res.json({ success: true })
})

export default router