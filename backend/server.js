import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config()

import authRoutes from './routes/auth.js'
import ridesRoutes from './routes/rides.js'
import publicRidesRoutes from './routes/publicRides.js'
import driverRoutes from './routes/drivers.js'
import patientRoutes from './routes/patients.js'
import appointmentRoutes from './routes/appointments.js'
import invitationRoutes from './routes/invitations.js'
import publicInvitationRoutes from './routes/publicInvitations.js'
import organizationRoutes from './routes/organizations.js'
import userRoutes from './routes/users.js'
import { initializeGoogleSheets, getSheets } from './config/googleSheets.js'
import { SHEET_ID} from './constants/sheetConfig.js'
import emailService from './services/emailService.js'
import { authenticateToken } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3000

// Debug environment variables
console.log('Environment check:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set')
console.log('- EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'Not set')

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'https://acherniske.github.io',
    'https://d26gevognsrobh.cloudfront.net',
    process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type', 
        'Accept', 
        'Authorization',
        'Cache-Control',
        'X-HTTP-Method-Override'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}))
app.use(express.json())

// Initialize Google Sheets on startup
await initializeGoogleSheets()
console.log('Google Sheets initialized')

// Check email service status
setTimeout(() => {
    console.log('Email service status:', emailService.transporter ? 'Ready' : 'Not ready')
}, 1000) // Give it a moment to initialize

// Health check routes (AWS EB checks root path by default)
app.get('/', (req, res) => {
    res.json({ 
        status: 'healthy',
        message: 'Provider Portal API is running',
        timestamp: new Date().toISOString()
    })
})

app.get('/health', (req, res) => {
    const sheets = getSheets()
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sheets: sheets ? 'connected' : 'disconnected',
        email: emailService.transporter ? 'ready' : 'not ready'
    })
})

// Debug endpoint to see what headers CloudFront forwards
app.get('/debug/headers', (req, res) => {
    res.json({
        headers: req.headers,
        authorization: req.headers.authorization || 'Not present',
        customToken: req.headers['x-auth-token'] || 'Not present',
        forwardedToken: req.headers['x-forwarded-token'] || 'Not present'
    })
})

// Public API Routes (no authentication required)
app.use('/api', publicInvitationRoutes)
app.use('/api', publicRidesRoutes)
app.use('/api/auth', authRoutes)

// Protected API Routes (require authentication)
app.use('/api/org', authenticateToken, userRoutes)
app.use('/api/org', authenticateToken, ridesRoutes)
app.use('/api/org', authenticateToken, driverRoutes)  
app.use('/api/org', authenticateToken, patientRoutes)
app.use('/api/org', authenticateToken, appointmentRoutes)
app.use('/api/org', authenticateToken, organizationRoutes)
app.use('/api/org', authenticateToken, invitationRoutes)

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`)
    res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Connected to Google Sheet: ${SHEET_ID}`)
    console.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
})

export default app