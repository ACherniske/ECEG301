import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { organizationService } from './organizationService.js'
import { hashPassword, comparePassword } from '../utils/passwordUtils.js'

class UserService {
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findUserByEmail(email) {
    try {
      const sheets = getSheets()
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
      })

      const rows = response.data.values || []
      
      if (rows.length <= 1) {
        return null
      }

      // Find user by email
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row[2]?.toLowerCase() === email.toLowerCase() && row[6] === 'active') {
          return {
            id: row[1],
            email: row[2],
            firstName: row[3],
            lastName: row[4],
            role: row[5],
            status: row[6],
            organizationId: row[0],
            password: row[8] || '',
            rowIndex: i + 1 // Store row index for updates
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error finding user by email:', error)
      throw error
    }
  }

  /**
   * Find a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findUserById(userId) {
    try {
      const sheets = getSheets()
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
      })

      const rows = response.data.values || []
      
      if (rows.length <= 1) {
        return null
      }

      // Find user by ID
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row[1] === userId && row[6] === 'active') {
          return {
            id: row[1],
            email: row[2],
            firstName: row[3],
            lastName: row[4],
            role: row[5],
            status: row[6],
            organizationId: row[0],
            password: row[8] || '',
            rowIndex: i + 1
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error finding user by ID:', error)
      throw error
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password (will be hashed)
   * @returns {Promise<boolean>} Success status
   */
  async updatePassword(userId, newPassword) {
    try {
      const user = await this.findUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const hashedPassword = await hashPassword(newPassword)
      const sheets = getSheets()

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${PROVIDER_ACCOUNTS_SHEET}!I${user.rowIndex}`, // Column I is password
        valueInputOption: 'RAW',
        requestBody: {
          values: [[hashedPassword]]
        }
      })

      return true
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  /**
   * Verify user password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object if valid, null if invalid
   */
  async verifyUserCredentials(email, password) {
    try {
      const user = await this.findUserByEmail(email)
      if (!user) {
        return null
      }

      const storedPassword = user.password
      let passwordValid = false

      if (storedPassword.startsWith('$2b$')) {
        // Password is hashed
        passwordValid = await comparePassword(password, storedPassword)
      } else {
        // Plain text password (for development/migration)
        passwordValid = password === storedPassword
      }

      if (!passwordValid) {
        return null
      }

      // Return user without password field
      const { password: _, rowIndex, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      console.error('Error verifying credentials:', error)
      throw error
    }
  }

  /**
   * Get user with organization data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User with organization data
   */
  async getUserWithOrganization(userId) {
    try {
      const user = await this.findUserById(userId)
      if (!user) {
        return null
      }

      const organization = await organizationService.getOrganization(user.organizationId)
      
      // Return user without password field
      const { password: _, rowIndex, ...userWithoutPassword } = user
      
      return {
        user: userWithoutPassword,
        organization: organization || {
          id: user.organizationId,
          name: 'Healthcare Organization',
          address: '',
          phone: '',
          email: '',
          status: 'active'
        }
      }
    } catch (error) {
      console.error('Error getting user with organization:', error)
      throw error
    }
  }
}

export const userService = new UserService()
