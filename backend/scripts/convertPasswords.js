import { getSheets, initializeGoogleSheets } from '../config/googleSheets.js'
import { SHEET_ID, RANGES, PROVIDER_ACCOUNTS_SHEET } from '../constants/sheetConfig.js'
import { hashPassword } from '../utils/passwordUtils.js'
import readline from 'readline'
import dotenv from 'dotenv'

dotenv.config()

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Helper function to prompt user for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

// Helper function for colored console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Display current user status (hashed vs plain text passwords)
 */
async function analyzePasswords() {
  try {
    colorLog('\n🔍 Analyzing current password status...', 'cyan')
    
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    
    if (rows.length <= 1) {
      colorLog('❌ No users found in the system', 'red')
      return { total: 0, hashed: 0, plainText: 0, empty: 0 }
    }

    let hashedCount = 0
    let plainTextCount = 0
    let emptyCount = 0
    const userAnalysis = []

    console.log('\n📊 User Password Status:')
    console.log('─'.repeat(70))
    console.log('Email                         | Status    | Action Needed')
    console.log('─'.repeat(70))

    // Analyze each user
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2] || 'Unknown'
      const password = row[8] || ''
      const status = row[6] || 'unknown'
      
      let passwordStatus = ''
      let actionNeeded = ''
      
      if (!password.trim()) {
        emptyCount++
        passwordStatus = colorLog('EMPTY', 'red')
        actionNeeded = 'Set password'
      } else if (password.startsWith('$2b$')) {
        hashedCount++
        passwordStatus = 'HASHED'
        actionNeeded = 'None'
      } else {
        plainTextCount++
        passwordStatus = 'PLAIN'
        actionNeeded = 'Hash required'
      }
      
      const emailDisplay = email.length > 25 ? email.substring(0, 22) + '...' : email
      console.log(`${emailDisplay.padEnd(29)} | ${passwordStatus.padEnd(9)} | ${actionNeeded}`)
      
      userAnalysis.push({
        email,
        password,
        status,
        passwordStatus,
        rowIndex: i + 1
      })
    }

    console.log('─'.repeat(70))
    colorLog(`\n📈 Summary:`, 'blue')
    colorLog(`   Total users: ${rows.length - 1}`, 'white')
    colorLog(`   Hashed passwords: ${hashedCount}`, 'green')
    colorLog(`   Plain text passwords: ${plainTextCount}`, 'yellow')
    colorLog(`   Empty passwords: ${emptyCount}`, 'red')

    return {
      total: rows.length - 1,
      hashed: hashedCount,
      plainText: plainTextCount,
      empty: emptyCount,
      users: userAnalysis
    }
  } catch (error) {
    colorLog(`❌ Error analyzing passwords: ${error.message}`, 'red')
    throw error
  }
}

/**
 * Convert all plain text passwords to hashed passwords
 */
async function convertAllPasswords(analysis) {
  try {
    const usersToConvert = analysis.users.filter(user => 
      user.password && !user.password.startsWith('$2b$')
    )

    if (usersToConvert.length === 0) {
      colorLog('\n✅ No passwords need conversion!', 'green')
      return
    }

    colorLog(`\n🔐 Converting ${usersToConvert.length} passwords...`, 'cyan')
    
    const sheets = getSheets()
    const updates = []
    let convertedCount = 0

    for (const user of usersToConvert) {
      try {
        colorLog(`   Hashing password for: ${user.email}`, 'white')
        const hashedPassword = await hashPassword(user.password)
        
        updates.push({
          range: `${PROVIDER_ACCOUNTS_SHEET}!I${user.rowIndex}`,
          values: [[hashedPassword]]
        })
        
        convertedCount++
      } catch (error) {
        colorLog(`   ❌ Failed to hash password for ${user.email}: ${error.message}`, 'red')
      }
    }

    if (updates.length === 0) {
      colorLog('❌ No passwords were successfully hashed', 'red')
      return
    }

    // Perform batch update
    colorLog(`\n💾 Updating ${updates.length} passwords in Google Sheets...`, 'cyan')
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    })

    colorLog(`\n✅ Successfully converted ${convertedCount} passwords to hashed format!`, 'green')
    
  } catch (error) {
    colorLog(`❌ Password conversion failed: ${error.message}`, 'red')
    throw error
  }
}

/**
 * Convert password for a specific user
 */
async function convertSingleUserPassword(email) {
  try {
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
    })

    const rows = response.data.values || []
    let userFound = false
    let userRowIndex = -1

    // Find the user
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row[2]?.toLowerCase() === email.toLowerCase()) {
        userFound = true
        userRowIndex = i + 1
        const currentPassword = row[8] || ''

        if (currentPassword.startsWith('$2b$')) {
          colorLog(`✅ Password for ${email} is already hashed`, 'green')
          return
        }

        if (!currentPassword.trim()) {
          colorLog(`❌ Password for ${email} is empty. Please set a password first.`, 'red')
          return
        }

        // Hash the password
        colorLog(`🔐 Hashing password for ${email}...`, 'cyan')
        const hashedPassword = await hashPassword(currentPassword)

        // Update in Google Sheets
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${PROVIDER_ACCOUNTS_SHEET}!I${userRowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[hashedPassword]]
          }
        })

        colorLog(`✅ Successfully converted password for ${email}`, 'green')
        break
      }
    }

    if (!userFound) {
      colorLog(`❌ User with email ${email} not found`, 'red')
    }

  } catch (error) {
    colorLog(`❌ Failed to convert password for ${email}: ${error.message}`, 'red')
    throw error
  }
}

/**
 * Main interactive menu
 */
async function showMenu() {
  colorLog('\n🔐 Password Conversion Utility', 'magenta')
  colorLog('═'.repeat(50), 'magenta')
  colorLog('1. Analyze current password status', 'white')
  colorLog('2. Convert all plain text passwords', 'white')
  colorLog('3. Convert specific user password', 'white')
  colorLog('4. Exit', 'white')
  colorLog('═'.repeat(50), 'magenta')

  const choice = await askQuestion('\nSelect an option (1-4): ')

  switch (choice) {
    case '1':
      const analysis = await analyzePasswords()
      
      if (analysis.plainText > 0) {
        const convert = await askQuestion('\nWould you like to convert all plain text passwords now? (y/n): ')
        if (convert.toLowerCase() === 'y' || convert.toLowerCase() === 'yes') {
          await convertAllPasswords(analysis)
        }
      }
      break

    case '2':
      const analysisForConvert = await analyzePasswords()
      
      if (analysisForConvert.plainText > 0) {
        const confirm = await askQuestion(`\nThis will convert ${analysisForConvert.plainText} passwords. Continue? (y/n): `)
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          await convertAllPasswords(analysisForConvert)
        } else {
          colorLog('Operation cancelled', 'yellow')
        }
      }
      break

    case '3':
      const email = await askQuestion('\nEnter user email: ')
      if (email) {
        await convertSingleUserPassword(email)
      } else {
        colorLog('❌ Email is required', 'red')
      }
      break

    case '4':
      colorLog('\n👋 Goodbye!', 'green')
      rl.close()
      return

    default:
      colorLog('❌ Invalid option. Please select 1-4.', 'red')
      break
  }

  // Show menu again unless exiting
  if (choice !== '4') {
    const continueChoice = await askQuestion('\nPress Enter to continue or type "exit" to quit: ')
    if (continueChoice.toLowerCase() === 'exit') {
      colorLog('\n👋 Goodbye!', 'green')
      rl.close()
      return
    }
    await showMenu()
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Initialize Google Sheets
    colorLog('🚀 Initializing Google Sheets connection...', 'cyan')
    await initializeGoogleSheets()
    colorLog('✅ Connected to Google Sheets', 'green')

    // Check if running with command line arguments
    const args = process.argv.slice(2)
    
    if (args.length > 0) {
      const command = args[0].toLowerCase()
      
      switch (command) {
        case 'analyze':
          await analyzePasswords()
          break
          
        case 'convert-all':
          const analysis = await analyzePasswords()
          if (analysis.plainText > 0) {
            await convertAllPasswords(analysis)
          }
          break
          
        case 'convert-user':
          const email = args[1]
          if (!email) {
            colorLog('❌ Email is required. Usage: npm run convert-passwords convert-user <email>', 'red')
            process.exit(1)
          }
          await convertSingleUserPassword(email)
          break
          
        default:
          colorLog(`❌ Unknown command: ${command}`, 'red')
          colorLog('Available commands: analyze, convert-all, convert-user <email>', 'white')
          process.exit(1)
      }
      
      rl.close()
    } else {
      // Interactive mode
      await showMenu()
    }

  } catch (error) {
    colorLog(`❌ Fatal error: ${error.message}`, 'red')
    console.error(error)
    rl.close()
    process.exit(1)
  }
}

// Run the script
main()
