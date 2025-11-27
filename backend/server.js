import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeGoogleSheets, getSheets } from './config/googleSheets.js'
import { SHEET_ID, RIDES_SHEET } from './constants/sheetConfig.js'
import ridesRouter from './routes/rides.js'
import patientsRouter from './routes/patients.js'
import appointmentsRouter from './routes/appointments.js'
import driversRouter from './routes/drivers.js'
import invitationsRouter from './routes/invitations.js'
import usersRouter from './routes/users.js'
import publicInvitationsRouter from './routes/publicInvitations.js'
import { emailService } from './services/emailService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Debug environment variables
console.log('Environment check:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set')
console.log('- EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'Not set')

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())

// Initialize Google Sheets on startup
await initializeGoogleSheets()
console.log('Google Sheets initialized')

// Check email service status
setTimeout(() => {
    console.log('Email service status:', emailService.transporter ? 'Ready' : 'Not ready')
}, 1000) // Give it a moment to initialize

// Health check
app.get('/health', (req, res) => {
    const sheets = getSheets()
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sheets: sheets ? 'connected' : 'disconnected',
        email: emailService.transporter ? 'ready' : 'not ready'
    })
})

// Public API Routes (no authentication required)
app.use('/api', publicInvitationsRouter)

// Protected API Routes (require authentication)
app.use('/api/org', ridesRouter)
app.use('/api/org', patientsRouter)
app.use('/api/org', appointmentsRouter)
app.use('/api/org', driversRouter)
app.use('/api/org', invitationsRouter)
app.use('/api/org', usersRouter)

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