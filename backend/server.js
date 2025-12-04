import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables FIRST - only in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config()
}

import authRoutes from './routes/auth.js'
import ridesRoutes from './routes/rides.js'
import publicRidesRoutes from './routes/publicRides.js'
import driverRoutes from './routes/drivers.js'
import driverPortalRoutes from './routes/driverPortal.js'
import patientRoutes from './routes/patients.js'
import appointmentRoutes from './routes/appointments.js'
import invitationRoutes from './routes/invitations.js'
import publicInvitationRoutes from './routes/publicInvitations.js'
import organizationRoutes from './routes/organizations.js'
import userRoutes from './routes/users.js'
import { initializeGoogleSheets, isInitialized } from './config/googleSheets.js'
import { SHEET_ID } from './constants/sheetConfig.js'
import { authenticateToken } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3000

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://acherniske.github.io',
    process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true)
        
        // Check if origin matches allowed list or starts with github.io domain
        if (allowedOrigins.includes(origin) || origin.startsWith('https://acherniske.github.io')) {
            return callback(null, true)
        }
        
        callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 200
}))

app.use(express.json())

// Initialize services
let servicesInitialized = false

async function initializeServices() {
    if (servicesInitialized) return true
    
    try {
        await initializeGoogleSheets()
        servicesInitialized = true
        return true
    } catch (error) {
        console.error('Failed to initialize services:', error.message)
        return false
    }
}

// Middleware to ensure services are initialized before handling requests
app.use(async (req, res, next) => {
    if (!servicesInitialized) {
        try {
            await initializeServices()
        } catch (error) {
            return res.status(503).json({ 
                error: 'Service unavailable', 
                message: 'Backend services are initializing. Please try again.' 
            })
        }
    }
    next()
})

// Health check routes
app.get('/', (req, res) => {
    res.json({ 
        status: 'healthy',
        message: 'Provider Portal API is running',
        timestamp: new Date().toISOString()
    })
})

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sheets: isInitialized() ? 'connected' : 'disconnected'
    })
})

// Public API Routes (no authentication required)
app.use('/api', publicInvitationRoutes)
app.use('/api', publicRidesRoutes)
app.use('/api/auth', authRoutes)

// Driver Portal Routes (JWT authentication required, driver role)
app.use('/api/driver', driverPortalRoutes)

// Protected API Routes (require authentication)
app.use('/api/org', authenticateToken, userRoutes)
app.use('/api/org', authenticateToken, ridesRoutes)
app.use('/api/org', authenticateToken, driverRoutes)  
app.use('/api/org', authenticateToken, patientRoutes)
app.use('/api/org', authenticateToken, appointmentRoutes)
app.use('/api/org', authenticateToken, organizationRoutes)
app.use('/api/org', authenticateToken, invitationRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message)
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// Start server only when not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
    initializeServices().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
            console.log(`Connected to Google Sheet: ${SHEET_ID}`)
        })
    }).catch(error => {
        console.error('Failed to start server:', error)
        process.exit(1)
    })
}

export default app