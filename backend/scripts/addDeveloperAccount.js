import dotenv from 'dotenv'
import { initializeGoogleSheets, getSheets } from '../config/googleSheets.js'
import { SHEET_ID, PROVIDER_ACCOUNTS_SHEET, RANGES } from '../constants/sheetConfig.js'
import bcrypt from 'bcrypt'

// Load environment variables
dotenv.config()

/**
 * Add a new developer account to org1
 */
async function addDeveloperAccount() {
    console.log('🧑‍💻 Adding new developer account to org1')
    console.log('==========================================')
    
    try {
        // Initialize Google Sheets
        console.log('Initializing Google Sheets...')
        await initializeGoogleSheets()
        console.log('✅ Google Sheets connected')
        
        const sheets = getSheets()
        const orgId = 'org1'
        
        // Get developer details
        const developerInfo = {
            email: 'developer@example.com',
            firstName: 'Dev',
            lastName: 'User',
            role: 'dev',
            password: 'devPassword123!'
        }
        
        // Allow command line arguments to override defaults
        if (process.argv.length >= 3) {
            const args = process.argv.slice(2)
            if (args[0]) developerInfo.email = args[0]
            if (args[1]) developerInfo.firstName = args[1]
            if (args[2]) developerInfo.lastName = args[2]
            if (args[3]) developerInfo.password = args[3]
        }
        
        console.log('Developer Info:')
        console.log(`- Email: ${developerInfo.email}`)
        console.log(`- Name: ${developerInfo.firstName} ${developerInfo.lastName}`)
        console.log(`- Role: ${developerInfo.role}`)
        console.log(`- Password: ${'*'.repeat(developerInfo.password.length)}`)
        console.log()
        
        // Get existing provider accounts
        console.log('Checking existing accounts...')
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
        })

        const rows = response.data.values || []
        
        // Check if user already exists
        const existingUser = rows.slice(1).find(row => 
            row[0] === orgId && row[2] === developerInfo.email.toLowerCase()
        )

        if (existingUser) {
            console.log(`❌ User with email ${developerInfo.email} already exists in ${orgId}`)
            console.log('Existing user:', {
                id: existingUser[1],
                email: existingUser[2],
                name: `${existingUser[3]} ${existingUser[4]}`,
                role: existingUser[5],
                status: existingUser[6]
            })
            return
        }
        
        // Generate new user ID
        const existingIds = rows
            .slice(1)
            .filter(row => row[0] === orgId)
            .map(row => parseInt(row[1]))
            .filter(id => !isNaN(id))
        
        const newUserId = existingIds.length > 0 
            ? (Math.max(...existingIds) + 1).toString()
            : '1'
            
        console.log(`Generated new user ID: ${newUserId}`)
        
        // Hash password
        console.log('Hashing password...')
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(developerInfo.password, saltRounds)
        
        // Prepare row data
        const values = [
            orgId, // A: OrgId
            newUserId, // B: UserId
            developerInfo.email.toLowerCase().trim(), // C: Email
            developerInfo.firstName.trim(), // D: FirstName
            developerInfo.lastName.trim(), // E: LastName
            developerInfo.role, // F: Role
            'active', // G: Status
            new Date().toISOString().split('T')[0], // H: Created Date
            hashedPassword // I: Password (if the sheet supports it)
        ]
        
        // Add to sheet
        console.log('Adding user to Google Sheets...')
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${PROVIDER_ACCOUNTS_SHEET}!${RANGES.PROVIDER_ACCOUNTS}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [values]
            }
        })
        
        console.log('✅ Successfully added developer account!')
        console.log('Account Details:')
        console.log(`- Organization: ${orgId}`)
        console.log(`- User ID: ${newUserId}`)
        console.log(`- Email: ${developerInfo.email}`)
        console.log(`- Name: ${developerInfo.firstName} ${developerInfo.lastName}`)
        console.log(`- Role: ${developerInfo.role}`)
        console.log(`- Status: active`)
        console.log(`- Created: ${new Date().toISOString().split('T')[0]}`)
        console.log()
        console.log('🎉 Developer account creation completed successfully!')
        
    } catch (error) {
        console.error('❌ Error adding developer account:', error)
        process.exit(1)
    }
}

// Show usage if --help is provided
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node addDeveloperAccount.js [email] [firstName] [lastName] [password]')
    console.log('')
    console.log('Examples:')
    console.log('  node addDeveloperAccount.js')
    console.log('  node addDeveloperAccount.js john@example.com John Doe mypassword123')
    console.log('')
    console.log('If no arguments provided, defaults will be used:')
    console.log('  Email: developer@example.com')
    console.log('  Name: Dev User')
    console.log('  Role: dev')
    console.log('  Password: devPassword123!')
    process.exit(0)
}

// Run the script
addDeveloperAccount()
