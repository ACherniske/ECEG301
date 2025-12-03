import { getSheets, initializeGoogleSheets } from './config/googleSheets.js'
import { SHEET_ID, RIDES_SHEET, RANGES } from './constants/sheetConfig.js'
import dotenv from 'dotenv'

dotenv.config()

async function checkRideData() {
    console.log('🔍 Checking ride data for debugging...\n')
    
    try {
        await initializeGoogleSheets()
        const sheets = getSheets()
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length === 0) {
            console.log('❌ No rides found')
            return
        }

        console.log('📋 All rides in sheet:')
        console.log('   ID | Patient | Date | Provider | Pickup | DOTW (R) | Distance (S)')
        console.log('   ' + '-'.repeat(80))

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const safeRow = [...row]
            while (safeRow.length < 21) safeRow.push('')

            const rideId = safeRow[1]
            const patientName = safeRow[2]
            const appointmentDate = safeRow[4]
            const providerLocation = safeRow[9]
            const pickupLocation = safeRow[12]
            const dotw = safeRow[17] // Column R
            const distanceToProvider = safeRow[18] // Column S

            console.log(`   ${rideId.padEnd(2)} | ${patientName.substring(0,15).padEnd(15)} | ${appointmentDate} | ${providerLocation.substring(0,20).padEnd(20)} | ${pickupLocation.substring(0,15).padEnd(15)} | ${dotw.padEnd(8)} | ${distanceToProvider}`)
        }

        // Focus on ride 6
        console.log('\n🎯 Detailed info for ride 6:')
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row[1] === '6') {
                console.log('   Row data:', row)
                console.log('   Column R (DOTW):', row[17] || 'EMPTY')
                console.log('   Column S (Distance):', row[18] || 'EMPTY')
                break
            }
        }

    } catch (error) {
        console.error('❌ Error checking ride data:', error.message)
    }
}

checkRideData()
