import dotenv from 'dotenv'
import { initializeGoogleSheets } from '../config/googleSheets.js'
import { generateAppointments } from './generateFakeAppointments.js'

// Load environment variables
dotenv.config()

const main = async () => {
    console.log('🏥 Fake Appointment Generator for org1')
    console.log('====================================')
    
    try {
        // Initialize Google Sheets
        console.log('Initializing Google Sheets...')
        await initializeGoogleSheets()
        console.log('✅ Google Sheets connected')
        
        // Generate appointments
        await generateAppointments()
        
        console.log('\n🎉 Appointment generation completed successfully!')
        
    } catch (error) {
        console.error('❌ Error in appointment generation:', error)
        process.exit(1)
    }
}

// Run the script
main()
