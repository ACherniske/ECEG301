import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, ORGANIZATIONS_SHEET, RANGES } from '../constants/sheetConfig.js'

export const organizationService = {
  // Get organization by ID
  getOrganization: async (orgId) => {
    try {
      const sheets = getSheets()
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${ORGANIZATIONS_SHEET}!${RANGES.ORGANIZATIONS}`,
      })

      const rows = response.data.values || []
      
      if (rows.length <= 1) {
        return null
      }

      // Find organization by ID
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row[0] === orgId && row[5] === 'active') { // Check status
          return {
            id: row[0],
            name: row[1] || 'Unknown Organization',
            address: row[2] || '',
            phone: row[3] || '',
            email: row[4] || '',
            status: row[5] || 'active'
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching organization:', error)
      throw new Error('Failed to fetch organization data')
    }
  },

  // Get all active organizations
  getAllOrganizations: async () => {
    try {
      const sheets = getSheets()
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${ORGANIZATIONS_SHEET}!${RANGES.ORGANIZATIONS}`,
      })

      const rows = response.data.values || []
      
      if (rows.length <= 1) {
        return []
      }

      return rows.slice(1)
        .filter(row => row[5] === 'active') // Only active organizations
        .map(row => ({
          id: row[0],
          name: row[1] || 'Unknown Organization',
          address: row[2] || '',
          phone: row[3] || '',
          email: row[4] || '',
          status: row[5] || 'active'
        }))
    } catch (error) {
      console.error('Error fetching organizations:', error)
      throw new Error('Failed to fetch organizations')
    }
  },

  // Create new organization
  createOrganization: async (orgData) => {
    try {
      const sheets = getSheets()
      
      // Get existing organizations to generate new ID
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${ORGANIZATIONS_SHEET}!${RANGES.ORGANIZATIONS}`,
      })

      const rows = response.data.values || []
      
      // Generate new org ID
      const existingIds = rows
        .slice(1) // Skip header
        .map(row => row[0])
        .filter(id => id && id.startsWith('org'))
        .map(id => parseInt(id.replace('org', '')))
        .filter(num => !isNaN(num))
      
      const newIdNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
      const newId = `org${newIdNumber}`

      const orgValues = [
        newId,
        orgData.name || '',
        orgData.address || '',
        orgData.phone || '',
        orgData.email || '',
        'active'
      ]

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${ORGANIZATIONS_SHEET}!${RANGES.ORGANIZATIONS}`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [orgValues]
        }
      })

      return {
        id: newId,
        name: orgData.name,
        address: orgData.address,
        phone: orgData.phone,
        email: orgData.email,
        status: 'active'
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      throw new Error('Failed to create organization')
    }
  }
}