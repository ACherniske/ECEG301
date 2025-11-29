import express from 'express'
import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RIDES_SHEET, APPOINTMENTS_SHEET, PATIENTS_SHEET, RANGES, VALID_STATUSES } from '../constants/sheetConfig.js'
import { authenticateToken } from '../middleware/auth.js'
import { emailService } from '../services/emailService.js'
import { generateConfirmationToken, createConfirmationData } from '../utils/tokenUtils.js'

const router = express.Router()

// Helper function to get patient email from EHR sheet
const getPatientEmail = async (patientId) => {
  try {
    const sheets = getSheets()
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PATIENTS_SHEET}!${RANGES.PATIENTS}`,
    })

    const rows = response.data.values || []
    
    // Find patient by ID
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row[1] === patientId) { // Column B = Patient ID (0-indexed, so B = 1)
        return row[7] || null // Column H = Email (0-indexed, so H = 7)
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching patient email:', error)
    return null
  }
}

// Helper function to store confirmation token (you might want to use a database instead)
const confirmationTokens = new Map()

const storeConfirmationToken = (rideId, token) => {
  const confirmationData = createConfirmationData(rideId, token)
  confirmationTokens.set(token, confirmationData)
  
  // Clean up expired tokens periodically
  setTimeout(() => {
    confirmationTokens.delete(token)
  }, 48 * 60 * 60 * 1000) // 48 hours
  
  return confirmationData
}

// Helper function to check if appointment is in the past
const isAppointmentInPast = (appointmentDate, appointmentTime) => {
  if (!appointmentDate) return false
  
  const now = new Date()
  const appointmentDateTime = new Date(appointmentDate)
  
  // If we have time, include it in the comparison
  if (appointmentTime) {
    const [hours, minutes] = appointmentTime.split(':')
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  }
  
  return appointmentDateTime < now
}

// Helper function to check for existing rides
const checkExistingRide = async (orgId, patientId, appointmentDate, appointmentTime, appointmentId = null) => {
  const sheets = getSheets()
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${RIDES_SHEET}!${RANGES.RIDES}`,
  })

  const rows = response.data.values || []
  
  // Check if a ride already exists for this appointment
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rideOrgId = row[0]
    const ridePatientId = row[3] // Updated column index
    const rideAppointmentDate = row[4] // Updated column index
    const rideAppointmentTime = row[8] // Updated column index
    const rideAppointmentId = row[5] // New appointment ID column
    const rideStatus = row[10] // Updated status column
    
    // Check if ride exists for same org, patient, date, and time
    // Also check appointmentId if provided
    // and is not cancelled or completed
    if (rideOrgId === orgId && 
        ridePatientId === patientId && 
        rideAppointmentDate === appointmentDate &&
        rideAppointmentTime === appointmentTime &&
        rideStatus !== 'cancelled' &&
        rideStatus !== 'completed') {
      
      // If appointmentId is provided, also check that
      if (appointmentId && rideAppointmentId === appointmentId) {
        return {
          exists: true,
          rideId: row[1],
          status: rideStatus
        }
      } else if (!appointmentId) {
        // Fallback to date/time matching if no appointmentId provided
        return {
          exists: true,
          rideId: row[1],
          status: rideStatus
        }
      }
    }
  }
  
  return { exists: false }
}

// GET /api/org/:orgId/rides
router.get('/:orgId/rides', authenticateToken, async (req, res) => {
    try {
        const { orgId } = req.params
        const sheets = getSheets()

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) return res.json([])

        const dataRows = rows.slice(1)
        const rides = dataRows.map((row, index) => {
            const safeRow = [...row]
            while (safeRow.length < 16) safeRow.push('') // Updated to 16 columns (A-P)
            
            return {
                orgId: safeRow[0] || '',
                id: safeRow[1] || (index + 1).toString(),
                patientName: safeRow[2] || '',
                patientId: safeRow[3] || '',
                appointmentDate: safeRow[4] || '',
                appointmentId: safeRow[5] || '', // New field
                pickupTime: safeRow[6] || '',
                roundTrip: safeRow[7] === 'true' || safeRow[7] === true || false,
                appointmentTime: safeRow[8] || '',
                providerLocation: safeRow[9] || '',
                status: safeRow[10] || 'pending',
                notes: safeRow[11] || '',
                pickupLocation: safeRow[12] || '',
                driverName: safeRow[13] || '',
                driverPlate: safeRow[14] || '',
                driverCar: safeRow[15] || '',
                rowIndex: index + 2
            }
        }).filter(ride => ride.patientName && ride.orgId === orgId)

        console.log(`Fetched ${rides.length} rides for org ${orgId}`)
        res.json(rides)
    } catch (error) {
        console.error('Error fetching rides:', error)
        res.status(500).json({ error: error.message })
    }
})

// POST /api/org/:orgId/rides - Create a new ride with email notification
router.post('/:orgId/rides', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params
    const rideData = req.body
    
    console.log('Creating ride for org:', orgId, 'with data:', rideData)

    // Validate required fields
    const requiredFields = ['patientId', 'patientName', 'appointmentDate', 'appointmentTime']
    for (const field of requiredFields) {
      if (!rideData[field]) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}`,
          field 
        })
      }
    }

    // Check if appointment is in the past
    if (isAppointmentInPast(rideData.appointmentDate, rideData.appointmentTime)) {
      return res.status(400).json({ 
        error: 'Cannot schedule rides for appointments that have already passed',
        type: 'PAST_APPOINTMENT',
        appointmentDate: rideData.appointmentDate,
        appointmentTime: rideData.appointmentTime
      })
    }

    // Check for existing rides
    const existingRide = await checkExistingRide(
      orgId, 
      rideData.patientId, 
      rideData.appointmentDate, 
      rideData.appointmentTime,
      rideData.appointmentId
    )

    if (existingRide.exists) {
      return res.status(409).json({ 
        error: 'A ride already exists for this appointment',
        type: 'DUPLICATE_RIDE',
        existingRideId: existingRide.rideId,
        existingRideStatus: existingRide.status,
        appointment: {
          date: rideData.appointmentDate,
          time: rideData.appointmentTime,
          patient: rideData.patientName
        }
      })
    }

    // Get patient email for notification
    const patientEmail = await getPatientEmail(rideData.patientId)
    console.log(`Patient email for ${rideData.patientId}:`, patientEmail)

    // If validation passes, proceed with ride creation
    const sheets = getSheets()

    // Get existing rides to generate new ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    
    // Generate new ride ID
    const existingIds = rows
      .slice(1) // Skip header
      .filter(row => row[0] === orgId) // Only rides for this org
      .map(row => parseInt(row[1]))
      .filter(id => !isNaN(id))
    
    const newId = existingIds.length > 0 
      ? (Math.max(...existingIds) + 1).toString()
      : '1'

    // Generate confirmation token
    const confirmationToken = generateConfirmationToken()
    storeConfirmationToken(newId, confirmationToken)

    // Prepare ride data with defaults
    const rideValues = [
      orgId, // A
      newId, // B
      rideData.patientName || '', // C
      rideData.patientId || '', // D
      rideData.appointmentDate || '', // E
      rideData.appointmentId || '', // F
      '', // G - pickupTime - empty until assigned
      rideData.roundTrip === true || rideData.roundTrip === 'true' ? 'true' : 'false', // H
      rideData.appointmentTime || '', // I
      rideData.providerLocation || rideData.appointmentLocation || '', // J
      'pending', // K - status (starts as pending, changes to confirmed after email confirmation)
      rideData.notes || '', // L
      rideData.pickupLocation || '', // M
      rideData.driverName || '', // N
      rideData.driverPlate || '', // O
      rideData.driverCar || '', // P
    ]

    // Add ride to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rideValues]
      }
    })

    const ride = {
      id: newId,
      orgId,
      patientId: rideData.patientId,
      patientName: rideData.patientName,
      patientEmail: patientEmail,
      appointmentDate: rideData.appointmentDate,
      appointmentId: rideData.appointmentId,
      appointmentTime: rideData.appointmentTime,
      providerLocation: rideData.providerLocation || rideData.appointmentLocation,
      providerName: rideData.providerName,
      pickupLocation: rideData.pickupLocation,
      notes: rideData.notes,
      pickupTime: '',
      roundTrip: rideData.roundTrip === true || rideData.roundTrip === 'true',
      driverName: rideData.driverName,
      driverPlate: rideData.driverPlate,
      driverCar: rideData.driverCar,
      status: 'pending',
      confirmationToken: confirmationToken,
      createdAt: new Date().toISOString()
    }

    // Send email notification if patient has email
    if (patientEmail) {
      try {
        console.log('Sending ride confirmation email to:', patientEmail)
        const emailResult = await emailService.sendPatientConfirmationEmail(
          patientEmail,
          rideData.patientName,
          ride
        )
        
        if (emailResult.success) {
          console.log(`Email notification sent successfully to ${patientEmail}`)
          ride.emailSent = true
          ride.emailMessageId = emailResult.messageId
          ride.confirmationUrl = emailResult.confirmationUrl
        } else {
          console.error('Failed to send email notification:', emailResult.error)
          ride.emailSent = false
          ride.emailError = emailResult.error
        }
      } catch (emailError) {
        console.error('Error sending ride confirmation email:', emailError)
        ride.emailSent = false
        ride.emailError = emailError.message
      }
    } else {
      console.log('No email found for patient, skipping email notification')
      ride.emailSent = false
      ride.emailError = 'No email address found for patient'
    }

    console.log(`Created ride ${newId} for org ${orgId}`)
    res.status(201).json(ride)
  } catch (error) {
    console.error('Error creating ride:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/rides/:rideId/details - Get ride details for confirmation (public endpoint)
router.get('/rides/:rideId/details', async (req, res) => {
  try {
    const { rideId } = req.params
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ error: 'Confirmation token is required' })
    }

    // Validate token
    const confirmationData = confirmationTokens.get(token)
    if (!confirmationData) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' })
    }

    if (confirmationData.rideId !== rideId) {
      return res.status(400).json({ error: 'Token does not match ride ID' })
    }

    if (new Date() > confirmationData.expiresAt) {
      confirmationTokens.delete(token)
      return res.status(400).json({ error: 'Confirmation token has expired' })
    }

    // Fetch ride details from sheet
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    const rideRow = rows.slice(1).find(row => row[1] === rideId)
    
    if (!rideRow) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    const ride = {
      id: rideRow[1],
      patientName: rideRow[2],
      appointmentDate: rideRow[4],
      appointmentTime: rideRow[8],
      pickupLocation: rideRow[12],
      providerLocation: rideRow[9],
      providerName: rideRow[13] || '',
      roundTrip: rideRow[7] === 'true',
      notes: rideRow[11],
      status: rideRow[10]
    }

    res.json(ride)
  } catch (error) {
    console.error('Error fetching ride details:', error)
    res.status(500).json({ error: 'Failed to fetch ride details' })
  }
})

// POST /api/rides/:rideId/confirm - Confirm ride (public endpoint)
router.post('/rides/:rideId/confirm', async (req, res) => {
  try {
    const { rideId } = req.params
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Confirmation token is required' })
    }

    // Validate token
    const confirmationData = confirmationTokens.get(token)
    if (!confirmationData) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' })
    }

    if (confirmationData.rideId !== rideId) {
      return res.status(400).json({ error: 'Token does not match ride ID' })
    }

    if (new Date() > confirmationData.expiresAt) {
      confirmationTokens.delete(token)
      return res.status(400).json({ error: 'Confirmation token has expired' })
    }

    // Update ride status to 'confirmed'
    const sheets = getSheets()
    
    // Get current ride data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    let rowIndex = -1
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === rideId) {
        rowIndex = i + 1 // Sheet is 1-indexed
        break
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    // Check if already confirmed
    if (rows[rowIndex - 1][10] === 'confirmed') {
      return res.status(400).json({ error: 'Ride has already been confirmed' })
    }

    // Update status to 'confirmed'
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!K${rowIndex}`, // Status column (K)
      valueInputOption: 'RAW',
      requestBody: {
        values: [['confirmed']]
      }
    })

    // Remove token after successful confirmation
    confirmationTokens.delete(token)

    console.log(`Ride ${rideId} confirmed by patient`)
    res.json({ success: true, message: 'Ride confirmed successfully' })
  } catch (error) {
    console.error('Error confirming ride:', error)
    res.status(500).json({ error: 'Failed to confirm ride' })
  }
})

// PATCH /api/org/:orgId/rides/:rideId/status
router.patch('/:orgId/rides/:rideId/status', authenticateToken, async (req, res) => {
    try {
        const { orgId, rideId } = req.params
        const { status, rowIndex } = req.body
        
        if (!status) return res.status(400).json({ error: 'Status is required' })
        if (!rowIndex) return res.status(400).json({ error: 'Row index is required' })
        if (!VALID_STATUSES.includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status value' })
        }

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}`,
        })

        const rideOrgId = response.data.values?.[0]?.[0]
        if (rideOrgId !== orgId) return res.status(403).json({ error: 'Access denied to this ride' })

        // Updated column K for status (was J)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!K${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[status]] }
        })

        console.log(`Updated ride ${rideId} status to ${status} for org ${orgId}`)
        res.json({ success: true, rideId, status, rowIndex })
    } catch (error) {
        console.error('Error updating ride status:', error)
        res.status(500).json({ error: error.message })
    }
})

// PATCH /api/org/:orgId/rides/:rideId
router.patch('/:orgId/rides/:rideId', authenticateToken, async (req, res) => {
    try {
        const { orgId, rideId } = req.params
        const { 
            appointmentId,
            pickupTime, 
            roundTrip,
            appointmentTime, 
            providerLocation, 
            notes, 
            pickupLocation, 
            driverName, 
            driverPlate, 
            driverCar, 
            rowIndex 
        } = req.body
        
        if (!rowIndex) return res.status(400).json({ error: 'Row index is required' })

        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!A${rowIndex}:P${rowIndex}`, // Updated to P
        })

        const rideRow = response.data.values?.[0]
        if (!rideRow || rideRow[0] !== orgId) {
            return res.status(403).json({ error: 'Access denied to this ride' })
        }

        const updates = []
        // Updated field mappings with new column structure
        const fieldMappings = [
            { field: 'appointmentId', column: 'F' }, // New field
            { field: 'pickupTime', column: 'G' }, // Shifted from F
            { field: 'roundTrip', column: 'H' }, // Shifted from G
            { field: 'appointmentTime', column: 'I' }, // Shifted from H
            { field: 'providerLocation', column: 'J' }, // Shifted from I
            { field: 'notes', column: 'L' }, // Shifted from K
            { field: 'pickupLocation', column: 'M' }, // Shifted from L
            { field: 'driverName', column: 'N' }, // Shifted from M
            { field: 'driverPlate', column: 'O' }, // Shifted from N
            { field: 'driverCar', column: 'P' } // Shifted from O
        ]

        fieldMappings.forEach(({ field, column }) => {
            if (req.body[field] !== undefined) {
                let value = req.body[field]
                
                // Handle boolean conversion for roundTrip
                if (field === 'roundTrip') {
                    value = value === true || value === 'true' ? 'true' : 'false'
                }
                
                updates.push({
                    range: `${RIDES_SHEET}!${column}${rowIndex}`,
                    values: [[value]]
                })
            }
        })

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: updates }
        })

        console.log(`Updated ride ${rideId} fields for org ${orgId}`)
        res.json({ success: true, rideId, updatedFields: req.body, rowIndex })
    } catch (error) {
        console.error('Error updating ride:', error)
        res.status(500).json({ error: error.message })
    }
})

// GET /api/rides/:rideId/details - Get ride details for confirmation (public endpoint)
router.get('/rides/:rideId/details', async (req, res) => {
  try {
    const { rideId } = req.params
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ error: 'Confirmation token is required' })
    }

    // Validate token
    const confirmationData = confirmationTokens.get(token)
    if (!confirmationData) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' })
    }

    if (confirmationData.rideId !== rideId) {
      return res.status(400).json({ error: 'Token does not match ride ID' })
    }

    if (new Date() > confirmationData.expiresAt) {
      confirmationTokens.delete(token)
      return res.status(400).json({ error: 'Confirmation token has expired' })
    }

    // Fetch ride details from sheet
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    const rideRow = rows.slice(1).find(row => row[1] === rideId)
    
    if (!rideRow) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    const ride = {
      id: rideRow[1],
      patientName: rideRow[2],
      appointmentDate: rideRow[4],
      appointmentTime: rideRow[8],
      pickupLocation: rideRow[12],
      providerLocation: rideRow[9],
      providerName: rideRow[13] || '',
      roundTrip: rideRow[7] === 'true',
      notes: rideRow[11],
      status: rideRow[10]
    }

    res.json(ride)
  } catch (error) {
    console.error('Error fetching ride details:', error)
    res.status(500).json({ error: 'Failed to fetch ride details' })
  }
})

// POST /api/rides/:rideId/confirm - Confirm ride (public endpoint)
router.post('/rides/:rideId/confirm', async (req, res) => {
  try {
    const { rideId } = req.params
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Confirmation token is required' })
    }

    // Validate token
    const confirmationData = confirmationTokens.get(token)
    if (!confirmationData) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' })
    }

    if (confirmationData.rideId !== rideId) {
      return res.status(400).json({ error: 'Token does not match ride ID' })
    }

    if (new Date() > confirmationData.expiresAt) {
      confirmationTokens.delete(token)
      return res.status(400).json({ error: 'Confirmation token has expired' })
    }

    // Update ride status to 'confirmed'
    const sheets = getSheets()
    
    // Get current ride data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!${RANGES.RIDES}`,
    })

    const rows = response.data.values || []
    let rowIndex = -1
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === rideId) {
        rowIndex = i + 1 // Sheet is 1-indexed
        break
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    // Check if already confirmed
    if (rows[rowIndex - 1][10] === 'confirmed') {
      return res.status(400).json({ error: 'Ride has already been confirmed' })
    }

    // Update status to 'confirmed'
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${RIDES_SHEET}!K${rowIndex}`, // Status column (K)
      valueInputOption: 'RAW',
      requestBody: {
        values: [['confirmed']]
      }
    })

    // Remove token after successful confirmation
    confirmationTokens.delete(token)

    console.log(`Ride ${rideId} confirmed by patient`)
    res.json({ success: true, message: 'Ride confirmed successfully' })
  } catch (error) {
    console.error('Error confirming ride:', error)
    res.status(500).json({ error: 'Failed to confirm ride' })
  }
})

export default router
