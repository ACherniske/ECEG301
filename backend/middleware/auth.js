export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Authentication required' })
    }
    
    // TODO: Verify JWT token here
    next()
}