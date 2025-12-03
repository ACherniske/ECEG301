import { getSheets, initializeGoogleSheets } from './config/googleSheets.js'
import { SHEET_ID, RIDES_SHEET, RANGES } from './constants/sheetConfig.js'
import { calculateRealDistance } from './services/mapsService.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Initialize the Google Sheets service
 */
async function initializeServices() {
    console.log('🔧 Initializing Google Sheets service...')
    try {
        await initializeGoogleSheets()
        const testSheets = getSheets()
        if (!testSheets) {
            throw new Error('Google Sheets service failed to initialize')
        }
        console.log('✅ Google Sheets service initialized successfully\n')
        return true
    } catch (initError) {
        console.error('❌ Failed to initialize Google Sheets service:', initError.message)
        console.error('   Check your GOOGLE_SERVICE_ACCOUNT_KEY in .env file')
        return false
    }
}

/**
 * Script to update all existing rides with:
 * 1. Day of the Week (DOTW) based on appointment date
 * 2. Distance to provider (pickup location to provider location)
 * 
 * This will populate columns R, S in the rides sheet
 */

async function updateRidesWithDistancesAndDOTW() {
    console.log('🚀 Starting ride update script...\n')
    
    // Initialize services first
    const initialized = await initializeServices()
    if (!initialized) {
        process.exit(1)
    }
    
    try {
        const sheets = getSheets()
        
        // Get all rides from the sheet
        console.log('📋 Fetching all rides from sheet...')
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length <= 1) {
            console.log('❌ No rides found to update')
            return
        }

        console.log(`📊 Found ${rows.length - 1} rides to process\n`)

        // Process each ride (skip header row)
        const updates = []
        let processedCount = 0
        let errorCount = 0

        for (let i = 1; i < rows.length; i++) {
            const rowIndex = i + 1 // 1-based for sheets API
            const row = rows[i]
            const safeRow = [...row]
            while (safeRow.length < 21) safeRow.push('')

            // Extract ride data
            const rideData = {
                rideId: safeRow[1],
                appointmentDate: safeRow[4],
                pickupLocation: safeRow[12],
                providerLocation: safeRow[9],
                currentDOTW: safeRow[17],
                currentDistanceToProvider: safeRow[18]
            }

            console.log(`🔄 Processing ride ${rideData.rideId} (${processedCount + 1}/${rows.length - 1})`)

            try {
                // Calculate Day of the Week
                let dayOfWeek = rideData.currentDOTW
                if (!dayOfWeek && rideData.appointmentDate) {
                    dayOfWeek = calculateDayOfWeek(rideData.appointmentDate)
                    console.log(`  📅 Calculated DOTW: ${dayOfWeek}`)
                }

                // Calculate distance to provider
                let distanceToProvider = rideData.currentDistanceToProvider
                if (!distanceToProvider && rideData.pickupLocation && rideData.providerLocation) {
                    console.log(`  📍 Calculating distance: ${rideData.pickupLocation} → ${rideData.providerLocation}`)
                    const distanceResult = await calculateRealDistance(rideData.pickupLocation, rideData.providerLocation)
                    distanceToProvider = distanceResult.distance
                    console.log(`  📏 Distance calculated: ${distanceToProvider}`)
                    
                    // Add small delay to avoid hitting API rate limits
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                // Prepare update if we have new data
                if ((dayOfWeek && dayOfWeek !== rideData.currentDOTW) || 
                    (distanceToProvider && distanceToProvider !== rideData.currentDistanceToProvider)) {
                    
                    updates.push({
                        rowIndex,
                        rideId: rideData.rideId,
                        dayOfWeek: dayOfWeek || '',
                        distanceToProvider: distanceToProvider || ''
                    })

                    console.log(`  ✅ Queued for update: DOTW=${dayOfWeek}, Distance=${distanceToProvider}`)
                } else {
                    console.log(`  ⏭️  No update needed (data already present)`)
                }

                processedCount++

            } catch (error) {
                console.error(`  ❌ Error processing ride ${rideData.rideId}:`, error.message)
                errorCount++
            }
        }

        // Perform batch updates
        if (updates.length > 0) {
            console.log(`\n💾 Applying ${updates.length} updates to sheet...`)
            
            for (const update of updates) {
                try {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: SHEET_ID,
                        range: `${RIDES_SHEET}!R${update.rowIndex}:S${update.rowIndex}`, // DOTW and distance to provider
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: [[update.dayOfWeek, update.distanceToProvider]]
                        }
                    })
                    
                    console.log(`  ✅ Updated ride ${update.rideId}: DOTW=${update.dayOfWeek}, Distance=${update.distanceToProvider}`)
                } catch (updateError) {
                    console.error(`  ❌ Failed to update ride ${update.rideId}:`, updateError.message)
                    errorCount++
                }
            }
        }

        // Summary
        console.log('\n📈 UPDATE SUMMARY:')
        console.log(`  📊 Total rides processed: ${processedCount}`)
        console.log(`  💾 Rides updated: ${updates.length}`)
        console.log(`  ❌ Errors encountered: ${errorCount}`)
        
        if (errorCount === 0) {
            console.log('  🎉 All updates completed successfully!')
        } else {
            console.log('  ⚠️  Some updates failed - check error messages above')
        }

        // Configuration status
        console.log('\n🔧 CONFIGURATION STATUS:')
        console.log(`  🗝️  Google Maps API Key: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Missing'}`)
        console.log(`  📋 Google Sheets API: ✅ Working`)

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.log('\n📝 NOTE: Without Google Maps API key, distance calculations will use fallback estimates.')
            console.log('   See GOOGLE_MAPS_SETUP.md for setup instructions.')
        }

    } catch (error) {
        console.error('💥 Script failed:', error.message)
        console.error('Stack trace:', error.stack)
        process.exit(1)
    }
}

/**
 * Calculate day of the week from appointment date
 * Handles various date formats
 */
function calculateDayOfWeek(appointmentDate) {
    try {
        if (!appointmentDate) return ''
        
        let date
        
        // Try to parse different date formats
        if (appointmentDate.includes('/')) {
            // MM/DD/YYYY or MM/DD/YY format
            date = new Date(appointmentDate)
        } else if (appointmentDate.includes('-')) {
            // YYYY-MM-DD format
            date = new Date(appointmentDate)
        } else {
            // Try as is
            date = new Date(appointmentDate)
        }
        
        if (isNaN(date.getTime())) {
            console.log(`    ⚠️  Could not parse date: ${appointmentDate}`)
            return ''
        }
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[date.getDay()]
        
    } catch (error) {
        console.log(`    ❌ Error parsing date ${appointmentDate}:`, error.message)
        return ''
    }
}

/**
 * Dry run mode - shows what would be updated without making changes
 */
async function dryRunUpdate() {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
    
    // Initialize services first
    const initialized = await initializeServices()
    if (!initialized) {
        process.exit(1)
    }
    
    try {
        const sheets = getSheets()
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${RIDES_SHEET}!${RANGES.RIDES}`,
        })

        const rows = response.data.values || []
        if (rows.length <= 1) {
            console.log('❌ No rides found')
            return
        }

        console.log(`📊 Found ${rows.length - 1} rides\n`)

        let needsUpdate = 0
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const safeRow = [...row]
            while (safeRow.length < 21) safeRow.push('')

            const rideId = safeRow[1]
            const appointmentDate = safeRow[4]
            const pickupLocation = safeRow[12]
            const providerLocation = safeRow[9]
            const currentDOTW = safeRow[17]
            const currentDistanceToProvider = safeRow[18]

            console.log(`📋 Ride ${rideId}:`)
            console.log(`  📅 Appointment: ${appointmentDate || 'N/A'}`)
            console.log(`  📍 Pickup: ${pickupLocation || 'N/A'}`)
            console.log(`  🏥 Provider: ${providerLocation || 'N/A'}`)
            console.log(`  📆 Current DOTW: ${currentDOTW || 'MISSING'}`)
            console.log(`  📏 Current Distance: ${currentDistanceToProvider || 'MISSING'}`)
            
            const wouldUpdateDOTW = !currentDOTW && appointmentDate
            const wouldUpdateDistance = !currentDistanceToProvider && pickupLocation && providerLocation
            
            if (wouldUpdateDOTW || wouldUpdateDistance) {
                needsUpdate++
                console.log('  🔄 WOULD UPDATE:')
                if (wouldUpdateDOTW) {
                    const dotw = calculateDayOfWeek(appointmentDate)
                    console.log(`    📅 DOTW: ${dotw}`)
                }
                if (wouldUpdateDistance) {
                    console.log(`    📏 Distance: [Would calculate via Google Maps]`)
                }
            } else {
                console.log('  ✅ No update needed')
            }
            console.log('')
        }

        console.log(`📈 SUMMARY: ${needsUpdate} rides need updates`)
        console.log('\n💡 Run with --execute to apply changes')

    } catch (error) {
        console.error('❌ Dry run failed:', error.message)
    }
}

// Command line handling
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run') || args.includes('-n')
const isExecute = args.includes('--execute') || args.includes('-x')

if (isDryRun) {
    dryRunUpdate()
} else if (isExecute) {
    updateRidesWithDistancesAndDOTW()
} else {
    console.log('🚀 Ride Distance & DOTW Update Script')
    console.log('')
    console.log('Usage:')
    console.log('  node updateRideDistances.js --dry-run    # Preview changes')
    console.log('  node updateRideDistances.js --execute    # Apply changes')
    console.log('')
    console.log('This script will:')
    console.log('  📅 Calculate day of the week from appointment dates')
    console.log('  📏 Calculate distances from pickup to provider locations')
    console.log('  💾 Update the rides sheet with calculated values')
    console.log('')
    console.log('💡 Start with --dry-run to see what will be updated')
}
