import { calculateRealDistance, calculateTotalRideDistance, getDistanceToDriver } from './services/mapsService.js'

// Test script to demonstrate Google Maps integration
async function testDistanceCalculations() {
    console.log('=== Google Maps Distance Calculation Test ===\n')
    
    // Test addresses (using real locations for demo)
    const driverAddress = '123 Main St, Austin, TX'
    const pickupAddress = '456 Oak Ave, Austin, TX'
    const providerAddress = '789 Medical Center Blvd, Austin, TX'
    
    console.log('Test addresses:')
    console.log(`Driver: ${driverAddress}`)
    console.log(`Pickup: ${pickupAddress}`)
    console.log(`Provider: ${providerAddress}\n`)
    
    try {
        // Test 1: Calculate distance from pickup to driver
        console.log('1. Calculating distance from pickup to driver...')
        const distanceToDriver = await calculateRealDistance(pickupAddress, driverAddress)
        console.log(`   Result: ${distanceToDriver.distance} (${distanceToDriver.duration})`)
        console.log(`   Raw values: ${distanceToDriver.distanceValue}m, ${distanceToDriver.durationValue}s\n`)
        
        // Test 2: Calculate driver distance for sorting
        console.log('2. Getting distance to driver for ride sorting...')
        const sortDistance = await getDistanceToDriver(driverAddress, pickupAddress)
        console.log(`   Result: ${sortDistance} miles\n`)
        
        // Test 3: Calculate total ride distance (one-way)
        console.log('3. Calculating total ride distance (one-way)...')
        const oneWayDistance = await calculateTotalRideDistance(driverAddress, pickupAddress, providerAddress, false)
        console.log(`   Total Distance: ${oneWayDistance.totalDistance}`)
        console.log(`   Total Duration: ${oneWayDistance.totalDuration}`)
        console.log('   Legs:')
        oneWayDistance.legs.forEach((leg, index) => {
            console.log(`     ${index + 1}. ${leg.name}: ${leg.distance} (${leg.duration})`)
        })
        console.log('')
        
        // Test 4: Calculate total ride distance (round-trip)
        console.log('4. Calculating total ride distance (round-trip)...')
        const roundTripDistance = await calculateTotalRideDistance(driverAddress, pickupAddress, providerAddress, true)
        console.log(`   Total Distance: ${roundTripDistance.totalDistance}`)
        console.log(`   Total Duration: ${roundTripDistance.totalDuration}`)
        console.log('   Legs:')
        roundTripDistance.legs.forEach((leg, index) => {
            console.log(`     ${index + 1}. ${leg.name}: ${leg.distance} (${leg.duration})`)
        })
        console.log('')
        
    } catch (error) {
        console.error('Error during distance calculation:', error.message)
    }
    
    console.log('=== Google Maps API Configuration Status ===')
    const hasApiKey = !!process.env.GOOGLE_MAPS_API_KEY
    console.log(`API Key Configured: ${hasApiKey ? '✅ Yes' : '❌ No'}`)
    
    if (!hasApiKey) {
        console.log('\n📝 To enable real Google Maps calculations:')
        console.log('1. Get a Google Maps API key from: https://console.cloud.google.com/')
        console.log('2. Enable Distance Matrix API and Geocoding API')
        console.log('3. Add GOOGLE_MAPS_API_KEY=your_key_here to your .env file')
        console.log('4. Restart the server')
        console.log('\n📋 See GOOGLE_MAPS_SETUP.md for detailed instructions')
    } else {
        console.log('✅ Ready to use real Google Maps calculations!')
    }
    
    console.log('\n=== Fallback Behavior ===')
    console.log('When Google Maps API is unavailable:')
    console.log('• Distance calculations use fallback estimates')
    console.log('• Ride claiming still works normally')
    console.log('• System continues to function without interruption')
}

// Export for use as standalone test
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
    testDistanceCalculations().then(() => {
        console.log('\n✅ Distance calculation test completed!')
        process.exit(0)
    }).catch(error => {
        console.error('❌ Test failed:', error)
        process.exit(1)
    })
}

export { testDistanceCalculations }
