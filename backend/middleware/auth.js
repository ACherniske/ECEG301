import { verifyToken, extractTokenFromHeader } from '../utils/jwtUtils.js'

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = extractTokenFromHeader(authHeader)
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'No token provided'
            })
        }

        // Verify the JWT token
        const decoded = verifyToken(token)
        
        // Add user info to request object for use in routes
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            organizationId: decoded.organizationId,
            firstName: decoded.firstName,
            lastName: decoded.lastName
        }
        
        next()
    } catch (error) {
        console.error('Token verification error:', error.message)
        return res.status(401).json({ 
            error: 'Authentication failed',
            message: error.message
        })
    }
}

// Middleware to check if user has specific role
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' })
        }
        
        const userRole = req.user.role
        const allowedRoles = Array.isArray(roles) ? roles : [roles]
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                message: `Required role: ${allowedRoles.join(' or ')}, but user has role: ${userRole}`
            })
        }
        
        next()
    }
}

// Middleware to check if user belongs to the organization in the request
export const requireSameOrganization = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    
    const userOrgId = req.user.organizationId
    const requestOrgId = req.params.orgId || req.body.organizationId
    
    if (requestOrgId && userOrgId !== requestOrgId) {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'You can only access resources for your own organization'
        })
    }
    
    next()
}