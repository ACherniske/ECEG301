#!/usr/bin/env node

/**
 * Simple command-line password conversion utility
 * Usage: node scripts/hashPasswords.js [command] [options]
 * 
 * Commands:
 *   status              - Show password status for all users
 *   hash-all           - Hash all plain text passwords
 *   hash-user <email>  - Hash password for specific user
 *   help              - Show this help message
 */

import { getSheets, initializeGoogleSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { hashPassword } from '../utils/passwordUtils.js'
import dotenv from 'dotenv'

dotenv.config()

// Command line arguments
const [,, command, ...args] = process.argv

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🔐 Password Hashing Utility

USAGE:
  npm run convert-passwords                    # Interactive mode
  npm run convert-passwords analyze           # Show password status
  npm run convert-passwords convert-all       # Convert all passwords
  npm run convert-passwords convert-user <email>  # Convert specific user

DIRECT USAGE:
  node scripts/hashPasswords.js status        # Show password status
  node scripts/hashPasswords.js hash-all      # Hash all plain passwords  
  node scripts/hashPasswords.js hash-user <email>  # Hash specific user
  node scripts/hashPasswords.js help          # Show this help

EXAMPLES:
  node scripts/hashPasswords.js status
  node scripts/hashPasswords.js hash-user john@example.com
  node scripts/hashPasswords.js hash-all
`)
}

/**
 * Show password status for all users
 */
async function showStatus() {
  try {
    console.log('🔍 Checking password status...')
    
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    
    if (rows.length <= 1) {
      console.log('❌ No users found')
      return
    }

    let hashedCount = 0
    let plainTextCount = 0
    let emptyCount = 0

    console.log('\n📊 Password Status Report:')
    console.log('─'.repeat(60))
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2] || 'Unknown'
      const password = row[8] || ''
      
      let status = ''
      if (!password.trim()) {
        emptyCount++
        status = '❌ EMPTY'
      } else if (password.startsWith('$2b$')) {
        hashedCount++
        status = '✅ HASHED'
      } else {
        plainTextCount++
        status = '⚠️  PLAIN TEXT'
      }
      
      console.log(`${email.padEnd(30)} ${status}`)
    }
    
    console.log('─'.repeat(60))
    console.log(`\nSummary:`)
    console.log(`  Total users: ${rows.length - 1}`)
    console.log(`  Hashed: ${hashedCount}`)
    console.log(`  Plain text: ${plainTextCount}`)
    console.log(`  Empty: ${emptyCount}`)
    
    if (plainTextCount > 0) {
      console.log(`\n⚠️  ${plainTextCount} passwords need to be hashed!`)
      console.log(`Run: node scripts/hashPasswords.js hash-all`)
    } else {
      console.log(`\n✅ All passwords are properly hashed!`)
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

/**
 * Hash all plain text passwords
 */
async function hashAllPasswords() {
  try {
    console.log('🔐 Hashing all plain text passwords...')
    
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    const updates = []
    let processedCount = 0

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2] || 'Unknown'
      const password = row[8] || ''
      
      // Skip if already hashed or empty
      if (!password.trim() || password.startsWith('$2b$')) {
        continue
      }

      try {
        console.log(`  Processing: ${email}`)
        const hashedPassword = await hashPassword(password)
        
        updates.push({
          range: `${PROVIDER_ACCOUNTS_SHEET}!I${i + 1}`,
          values: [[hashedPassword]]
        })
        
        processedCount++
      } catch (error) {
        console.error(`  ❌ Failed to hash password for ${email}:`, error.message)
      }
    }

    if (updates.length === 0) {
      console.log('ℹ️  No passwords to hash')
      return
    }

    console.log(`\n💾 Updating ${updates.length} passwords...`)
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    })

    console.log(`✅ Successfully hashed ${processedCount} passwords`)
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

/**
 * Hash password for specific user
 */
async function hashUserPassword(email) {
  try {
    if (!email) {
      console.error('❌ Email is required')
      console.log('Usage: node scripts/hashPasswords.js hash-user <email>')
      process.exit(1)
    }

    console.log(`🔐 Hashing password for: ${email}`)
    
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    let userFound = false

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row[2]?.toLowerCase() === email.toLowerCase()) {
        userFound = true
        const password = row[8] || ''

        if (password.startsWith('$2b$')) {
          console.log('ℹ️  Password is already hashed')
          return
        }

        if (!password.trim()) {
          console.error('❌ User has no password set')
          return
        }

        const hashedPassword = await hashPassword(password)
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${PROVIDER_ACCOUNTS_SHEET}!I${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[hashedPassword]]
          }
        })

        console.log('✅ Password hashed successfully')
        return
      }
    }

    if (!userFound) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Initialize Google Sheets
    await initializeGoogleSheets()
    
    switch (command) {
      case 'status':
        await showStatus()
        break
        
      case 'hash-all':
        await hashAllPasswords()
        break
        
      case 'hash-user':
        await hashUserPassword(args[0])
        break
        
      case 'help':
      case '--help':
      case '-h':
        showHelp()
        break
        
      default:
        console.error(`❌ Unknown command: ${command || 'none'}`)
        showHelp()
        process.exit(1)
    }
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
