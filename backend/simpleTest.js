import { calculateRealDistance, calculateTotalRideDistance, getDistanceToDriver } from './services/mapsService.js'

console.log('=== Google Maps Distance Calculation Test ===\n')

// Test addresses
const driverAddress = '123 Main St, Austin, TX'
const pickupAddress = '456 Oak Ave, Austin, TX'
const providerAddress = '789 Medical Center Blvd, Austin, TX'

console.log('Test addresses:')
console.log(`Driver: ${driverAddress}`)
console.log(`Pickup: ${pickupAddress}`)
console.log(`Provider: ${providerAddress}\n`)

try {
    console.log('Testing distance calculation...')
    const distanceResult = await calculateRealDistance(pickupAddress, driverAddress)
    console.log(`Distance result: ${JSON.stringify(distanceResult, null, 2)}`)
    
    const totalDistance = await calculateTotalRideDistance(driverAddress, pickupAddress, providerAddress, false)
    console.log(`Total distance result: ${JSON.stringify(totalDistance, null, 2)}`)
    
} catch (error) {
    console.error('Error:', error.message)
}

console.log('\n=== API Configuration ===')
console.log(`Google Maps API Key configured: ${!!process.env.GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}`)

if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log('\n📝 To enable real Google Maps calculations:')
    console.log('1. Add GOOGLE_MAPS_API_KEY=your_key to .env file')
    console.log('2. See GOOGLE_MAPS_SETUP.md for full instructions')
}

console.log('\n✅ Distance calculation test completed!')
