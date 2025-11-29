import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RIDES_SHEET, RANGES } from '../constants/sheetConfig.js'
import { getConfirmationData, deleteConfirmationToken } from '../utils/confirmationTokens.js'

const router = express.Router()

// GET /api/rides/:rideId/details - Get ride details for confirmation (public endpoint)
router.get('/rides/:rideId/details', async (req, res) => {
  try {
    const { rideId } = req.params
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ error: 'Confirmation token is required' })
    }

    // Validate token
    const confirmationData = getConfirmationData(token)
    if (!confirmationData) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' })
    }

    if (confirmationData.rideId !== rideId) {
      return res.status(400).json({ error: 'Token does not match ride ID' })
    }

    if (new Date() > confirmationData.expiresAt) {
      deleteConfirmationToken(token)
      return res.status(400).json({ error: 'Confirmation token has expired' })
    }

    // Fetch ride details from sheet
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    
    // Find the ride by ID
    const rideRow = rows.find(row => row[1] === rideId) // Column B (index 1) is the ride ID
    
    if (!rideRow) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    // Parse ride data
    const ride = {
      id: rideRow[1] || '',
      patientName: rideRow[2] || '',
      patientId: rideRow[3] || '',
      appointmentDate: rideRow[4] || '',
      appointmentId: rideRow[5] || '',
      pickupTime: rideRow[6] || '',
      roundTrip: rideRow[7] === 'true' || rideRow[7] === true || false,
      appointmentTime: rideRow[8] || '',
      providerLocation: rideRow[9] || '',
      status: rideRow[10] || 'pending',
      driverName: rideRow[11] || '',
      driverPlate: rideRow[12] || '',
      driverCar: rideRow[13] || '',
      appointmentType: rideRow[14] || '',
      providerName: rideRow[15] || '',
      patientPhone: rideRow[16] || '',
      pickupLocation: rideRow[17] || '',
      notes: rideRow[18] || ''
    }

    res.json(ride)
  } catch (error) {
    console.error('Error fetching ride details:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rides/:rideId/confirm - Confirm ride appointment (public endpoint)
router.post('/rides/:rideId/confirm', async (req, res) => {
  try {
    const { rideId } = req.params
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Confirmation token is required' })
    }

    // Validate token
    const confirmationData = getConfirmationData(token)
    if (!confirmationData) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' })
    }

    if (confirmationData.rideId !== rideId) {
      return res.status(400).json({ error: 'Token does not match ride ID' })
    }

    if (new Date() > confirmationData.expiresAt) {
      deleteConfirmationToken(token)
      return res.status(400).json({ error: 'Confirmation token has expired' })
    }

    // Update ride status to confirmed
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    
    // Find the ride row index
    let rideRowIndex = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === rideId) { // Column B (index 1) is the ride ID
        rideRowIndex = i + 1 // +1 for 1-based indexing in sheets
        break
      }
    }

    if (rideRowIndex === -1) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    // Update the status in the sheet (Column K = status)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!K${rideRowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [['confirmed']]
      }
    })

    // Remove the used token
    deleteConfirmationToken(token)

    res.json({ message: 'Ride confirmed successfully' })
  } catch (error) {
    console.error('Error confirming ride:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
