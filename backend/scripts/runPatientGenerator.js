import dotenv from 'dotenv'
import { initializeGoogleSheets } from '../config/googleSheets.js'
import { generatePatients } from './generateFakePatients.js'

// Load environment variables
dotenv.config()

const main = async () => {
    console.log('🏥 Fake Patient Generator for org1')
    console.log('==================================')
    
    try {
        // Initialize Google Sheets
        console.log('Initializing Google Sheets...')
        await initializeGoogleSheets()
        console.log('✅ Google Sheets connected')
        
        // Generate patients
        await generatePatients()
        
        console.log('\n🎉 Patient generation completed successfully!')
        
    } catch (error) {
        console.error('❌ Error in patient generation:', error)
        process.exit(1)
    }
}

// Run the script
main()
