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
 * 3. Pickup time based on appointment time - travel time - 15 minute buffer
 * 
 * This will populate columns G (pickupTime), R, S in the rides sheet
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
                appointmentTime: safeRow[8],
                pickupLocation: safeRow[12],
                providerLocation: safeRow[9],
                currentPickupTime: safeRow[6],
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

                // Calculate distance to provider and pickup time
                let distanceToProvider = rideData.currentDistanceToProvider
                let calculatedPickupTime = rideData.currentPickupTime
                
                if ((!distanceToProvider || !calculatedPickupTime) && rideData.pickupLocation && rideData.providerLocation) {
                    console.log(`  📍 Calculating distance: ${rideData.pickupLocation} → ${rideData.providerLocation}`)
                    const distanceResult = await calculateRealDistance(rideData.pickupLocation, rideData.providerLocation)
                    
                    if (!distanceToProvider) {
                        distanceToProvider = distanceResult.distance
                        console.log(`  📏 Distance calculated: ${distanceToProvider}`)
                    }
                    
                    // Calculate pickup time if we have appointment time and travel duration
                    if (!calculatedPickupTime && rideData.appointmentTime && distanceResult.durationValue) {
                        calculatedPickupTime = calculatePickupTime(rideData.appointmentTime, distanceResult.durationValue)
                        if (calculatedPickupTime) {
                            console.log(`  🕒 Pickup time calculated: ${calculatedPickupTime} (Travel: ${distanceResult.duration}, Buffer: 15min)`)
                        }
                    }
                    
                    // Add small delay to avoid hitting API rate limits
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                // Prepare update if we have new data
                if ((dayOfWeek && dayOfWeek !== rideData.currentDOTW) || 
                    (distanceToProvider && distanceToProvider !== rideData.currentDistanceToProvider) ||
                    (calculatedPickupTime && calculatedPickupTime !== rideData.currentPickupTime)) {
                    
                    updates.push({
                        rowIndex,
                        rideId: rideData.rideId,
                        pickupTime: calculatedPickupTime || rideData.currentPickupTime || '',
                        dayOfWeek: dayOfWeek || '',
                        distanceToProvider: distanceToProvider || ''
                    })

                    console.log(`  ✅ Queued for update: PickupTime=${calculatedPickupTime || 'unchanged'}, DOTW=${dayOfWeek}, Distance=${distanceToProvider}`)
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
                    // Update pickup time (column G)
                    if (update.pickupTime && update.pickupTime !== '') {
                        await sheets.spreadsheets.values.update({
                            spreadsheetId: SHEET_ID,
                            range: `${RIDES_SHEET}!G${update.rowIndex}`, // pickupTime column
                            valueInputOption: 'USER_ENTERED',
                            resource: {
                                values: [[update.pickupTime]]
                            }
                        })
                    }
                    
                    // Update DOTW and distance to provider (columns R and S)
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: SHEET_ID,
                        range: `${RIDES_SHEET}!R${update.rowIndex}:S${update.rowIndex}`, // DOTW and distance to provider
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: [[update.dayOfWeek, update.distanceToProvider]]
                        }
                    })
                    
                    console.log(`  ✅ Updated ride ${update.rideId}: PickupTime=${update.pickupTime || 'N/A'}, DOTW=${update.dayOfWeek}, Distance=${update.distanceToProvider}`)
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
 * Calculate pickup time based on appointment time - travel time - 15 minute buffer
 * Rounds result to the nearest quarter hour (15-minute intervals)
 */
function calculatePickupTime(appointmentTime, travelDurationSeconds, bufferMinutes = 15) {
    try {
        if (!appointmentTime || !travelDurationSeconds) return ''
        
        // Parse appointment time
        const [appointmentHours, appointmentMinutes] = appointmentTime.split(':').map(Number)
        if (isNaN(appointmentHours) || isNaN(appointmentMinutes)) {
            console.log(`    ⚠️  Could not parse appointment time: ${appointmentTime}`)
            return ''
        }
        
        const appointmentDate = new Date()
        appointmentDate.setHours(appointmentHours, appointmentMinutes, 0, 0)
        
        // Subtract travel time (in seconds) plus buffer minutes
        const totalDelaySeconds = travelDurationSeconds + (bufferMinutes * 60)
        const pickupDate = new Date(appointmentDate.getTime() - (totalDelaySeconds * 1000))
        
        // Handle negative time (pickup time before midnight)
        if (pickupDate.getDate() !== appointmentDate.getDate()) {
            console.log(`    ⚠️  Pickup time would be on previous day for appointment ${appointmentTime}`)
            return '' // Skip rides that would require pickup on previous day
        }
        
        // Round to nearest quarter hour (15-minute intervals)
        const minutes = pickupDate.getMinutes()
        const roundedMinutes = Math.round(minutes / 15) * 15
        
        // Handle overflow to next hour
        if (roundedMinutes >= 60) {
            pickupDate.setHours(pickupDate.getHours() + 1)
            pickupDate.setMinutes(0)
        } else {
            pickupDate.setMinutes(roundedMinutes)
        }
        
        // Format as HH:MM
        return `${pickupDate.getHours().toString().padStart(2, '0')}:${pickupDate.getMinutes().toString().padStart(2, '0')}`
        
    } catch (error) {
        console.log(`    ❌ Error calculating pickup time for ${appointmentTime}:`, error.message)
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
            const appointmentTime = safeRow[8]
            const pickupLocation = safeRow[12]
            const providerLocation = safeRow[9]
            const currentPickupTime = safeRow[6]
            const currentDOTW = safeRow[17]
            const currentDistanceToProvider = safeRow[18]

            console.log(`📋 Ride ${rideId}:`)
            console.log(`  📅 Appointment: ${appointmentDate || 'N/A'} at ${appointmentTime || 'N/A'}`)
            console.log(`  📍 Pickup: ${pickupLocation || 'N/A'}`)
            console.log(`  🏥 Provider: ${providerLocation || 'N/A'}`)
            console.log(`  🕒 Current Pickup Time: ${currentPickupTime || 'MISSING'}`)
            console.log(`  📆 Current DOTW: ${currentDOTW || 'MISSING'}`)
            console.log(`  📏 Current Distance: ${currentDistanceToProvider || 'MISSING'}`)
            
            const wouldUpdatePickupTime = !currentPickupTime && appointmentTime && pickupLocation && providerLocation
            const wouldUpdateDOTW = !currentDOTW && appointmentDate
            const wouldUpdateDistance = !currentDistanceToProvider && pickupLocation && providerLocation
            
            if (wouldUpdatePickupTime || wouldUpdateDOTW || wouldUpdateDistance) {
                needsUpdate++
                console.log('  🔄 WOULD UPDATE:')
                if (wouldUpdateDOTW) {
                    const dotw = calculateDayOfWeek(appointmentDate)
                    console.log(`    📅 DOTW: ${dotw}`)
                }
                if (wouldUpdateDistance) {
                    console.log(`    📏 Distance: [Would calculate via Google Maps]`)
                }
                if (wouldUpdatePickupTime) {
                    console.log(`    🕒 Pickup Time: [Would calculate based on travel time + 15min buffer]`)
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
    console.log('🚀 Ride Distance, DOTW & Pickup Time Update Script')
    console.log('')
    console.log('Usage:')
    console.log('  node updateRideDistances.js --dry-run    # Preview changes')
    console.log('  node updateRideDistances.js --execute    # Apply changes')
    console.log('')
    console.log('This script will:')
    console.log('  📅 Calculate day of the week from appointment dates')
    console.log('  📏 Calculate distances from pickup to provider locations')
    console.log('  🕒 Calculate pickup times (appointment time - travel time - 15min buffer)')
    console.log('  💾 Update the rides sheet with calculated values')
    console.log('')
    console.log('💡 Start with --dry-run to see what will be updated')
}
