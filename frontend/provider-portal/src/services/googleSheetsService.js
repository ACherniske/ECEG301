// services/googleSheetsService.js

class GoogleSheetsService {
  constructor() {
    this.config = {
      SHEET_ID: window.APP_CONFIG?.GOOGLE_SHEET_ID || '',
      API_KEY: window.APP_CONFIG?.GOOGLE_API_KEY || '',
      SHEET_NAME: window.APP_CONFIG?.SHEET_NAME || 'Rides',
    }
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }

  // Base URL for Google Sheets API
  getBaseUrl() {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SHEET_ID}`
  }

  // Fetch all values from a range
  async getValues(range) {
    const url = `${this.getBaseUrl()}/values/${this.config.SHEET_NAME}!${range}?key=${this.config.API_KEY}`
    
    console.log('Fetching from Google Sheets:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API key invalid or quota exceeded')
      } else if (response.status === 404) {
        throw new Error('Sheet not found - check Sheet ID and name')
      } else {
        throw new Error(`Google Sheets API error: ${response.status}`)
      }
    }

    const data = await response.json()
    return data.values || []
  }

  // Update a single cell
  async updateCell(cell, value) {
    // Note: This requires OAuth2, not just API key
    // For production, you'd need to implement Google Apps Script webhook
    const url = `${this.getBaseUrl()}/values/${this.config.SHEET_NAME}!${cell}?valueInputOption=RAW&key=${this.config.API_KEY}`
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[value]]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update cell: ${response.status}`)
    }

    return response.json()
  }

  // Batch update multiple cells
  async batchUpdate(updates) {
    // Note: This requires OAuth2, not just API key
    // updates format: [{ range: 'A2', values: [[value]] }]
    const url = `${this.getBaseUrl()}/values:batchUpdate?key=${this.config.API_KEY}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: updates
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to batch update: ${response.status}`)
    }

    return response.json()
  }

  // Append a new row
  async appendRow(values) {
    // Note: This requires OAuth2, not just API key
    const url = `${this.getBaseUrl()}/values/${this.config.SHEET_NAME}!A:H:append?valueInputOption=RAW&key=${this.config.API_KEY}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to append row: ${response.status}`)
    }

    return response.json()
  }

  // Fetch all rides
  async fetchRides() {
    try {
      const rows = await this.getValues('A:H')
      
      if (rows.length === 0) {
        throw new Error('No data found in the sheet')
      }

      // Skip header row
      const dataRows = rows.slice(1)
      
      // Convert rows to ride objects
      const rides = dataRows.map((row, index) => {
        const safeRow = [...row]
        while (safeRow.length < 8) {
          safeRow.push('')
        }
        
        return {
          id: safeRow[0] || (index + 1).toString(),
          patientName: safeRow[1] || '',
          patientId: safeRow[2] || '',
          appointmentDate: safeRow[3] || '',
          pickupTime: safeRow[4] || '',
          appointmentTime: safeRow[5] || '',
          location: safeRow[6] || '',
          status: safeRow[7] || 'pending',
          rowIndex: index + 2 // +2 because: +1 for array index, +1 for header row
        }
      }).filter(ride => ride.patientName) // Filter out empty rows

      return rides
    } catch (error) {
      console.error('Error fetching rides:', error)
      throw error
    }
  }

  // Update ride status
  async updateRideStatus(rideId, rowIndex, newStatus) {
    try {
      // Column H is the 8th column (status column)
      const cell = `H${rowIndex}`
      
      console.log(`Updating ride ${rideId} at ${cell} to status: ${newStatus}`)
      
      // NOTE: Direct cell updates require OAuth2 authentication
      // For read-only API key access, you'll need to use Google Apps Script
      // as a webhook endpoint instead
      
      // For now, this will throw an error explaining the limitation
      throw new Error(
        'Direct updates require OAuth2. Please use Google Apps Script webhook or update manually in the sheet.'
      )
      
      // Uncomment this if you have OAuth2 set up:
      // await this.updateCell(cell, newStatus)
      // return { success: true, rideId, newStatus }
    } catch (error) {
      console.error('Error updating ride status:', error)
      throw error
    }
  }

  // Add a new ride
  async addRide(ride) {
    try {
      const values = [
        ride.id,
        ride.patientName,
        ride.patientId,
        ride.appointmentDate,
        ride.pickupTime,
        ride.appointmentTime,
        ride.location,
        ride.status || 'pending'
      ]

      console.log('Adding new ride:', values)
      
      // NOTE: Append requires OAuth2 authentication
      throw new Error(
        'Direct append requires OAuth2. Please use Google Apps Script webhook or add manually in the sheet.'
      )
      
      // Uncomment this if you have OAuth2 set up:
      // await this.appendRow(values)
      // return { success: true, ride }
    } catch (error) {
      console.error('Error adding ride:', error)
      throw error
    }
  }
}

// Create singleton instance
export const googleSheetsService = new GoogleSheetsService()