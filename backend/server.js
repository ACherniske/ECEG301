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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())

// Initialize Google Sheets on startup
await initializeGoogleSheets()

// Health check
app.get('/health', (req, res) => {
    const sheets = getSheets()
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sheets: sheets ? 'connected' : 'disconnected'
    })
})

// API Routes
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
    res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Connected to Google Sheet: ${SHEET_ID}`)
})

export default app