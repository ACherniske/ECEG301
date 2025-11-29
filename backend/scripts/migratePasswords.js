import { getSheets, initializeGoogleSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { hashPassword } from '../utils/passwordUtils.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Migration script to hash existing plain text passwords
 * Run this script once to migrate all plain text passwords to hashed passwords
 */
async function migratePasswords() {
  try {
    console.log('Starting password migration...')
    
    // Initialize Google Sheets
    await initializeGoogleSheets()
    const sheets = getSheets()
    
    // Get all users from ProviderAccounts sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    
    if (rows.length <= 1) {
      console.log('No users found to migrate')
      return
    }

    let migratedCount = 0
    const updates = []

    // Process each user row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2]
      const currentPassword = row[8] || ''
      
      // Skip if password is already hashed (starts with $2b$)
      if (currentPassword.startsWith('$2b$')) {
        console.log(`Password for ${email} is already hashed, skipping`)
        continue
      }
      
      // Skip if password is empty
      if (!currentPassword.trim()) {
        console.log(`Password for ${email} is empty, skipping`)
        continue
      }

      try {
        // Hash the password
        const hashedPassword = await hashPassword(currentPassword)
        
        // Prepare update
        updates.push({
          range: `${PROVIDER_ACCOUNTS_SHEET}!I${i + 1}`, // Column I, row i+1 (1-indexed)
          values: [[hashedPassword]]
        })
        
        migratedCount++
        console.log(`Prepared password hash for ${email}`)
      } catch (error) {
        console.error(`Error hashing password for ${email}:`, error)
      }
    }

    if (updates.length === 0) {
      console.log('No passwords to migrate')
      return
    }

    // Perform batch update
    console.log(`Updating ${updates.length} passwords...`)
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    })

    console.log(`✅ Successfully migrated ${migratedCount} passwords to hashed format`)
  } catch (error) {
    console.error('❌ Password migration failed:', error)
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePasswords()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { migratePasswords }
