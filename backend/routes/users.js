import express from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// TODO: Implement with actual data source
router.get('/:orgId/users', authenticateToken, async (req, res) => {
    res.json([])
})

router.delete('/:orgId/users/:userId', authenticateToken, async (req, res) => {
    res.json({ success: true })
})

export default router