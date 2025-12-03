/**
 * Test script for pickup time calculation functionality
 */
import dotenv from 'dotenv'
dotenv.config()

// Mock Google Maps API response for testing
const mockTravelResult = {
    distance: '5.2 mi',
    duration: '12 mins',
    durationValue: 720 // 12 minutes in seconds
}

/**
 * Calculate pickup time based on travel time from pickup to provider
 * This is the same logic used in the route handlers
 */
function calculatePickupTime(appointmentTime, travelDurationSeconds, bufferMinutes = 15) {
    try {
        // Parse appointment time
        const [appointmentHours, appointmentMinutes] = appointmentTime.split(':').map(Number)
        const appointmentDate = new Date()
        appointmentDate.setHours(appointmentHours, appointmentMinutes, 0, 0)
        
        // Subtract travel time (in seconds) plus buffer minutes
        const totalDelaySeconds = travelDurationSeconds + (bufferMinutes * 60)
        const pickupDate = new Date(appointmentDate.getTime() - (totalDelaySeconds * 1000))
        
        // Handle negative time (pickup time before midnight)
        if (pickupDate.getDate() !== appointmentDate.getDate()) {
            console.warn('Pickup time would be on previous day, may need adjustment')
        }
        
        // Format as HH:MM
        return `${pickupDate.getHours().toString().padStart(2, '0')}:${pickupDate.getMinutes().toString().padStart(2, '0')}`
        
    } catch (error) {
        console.error('Error calculating pickup time:', error)
        return ''
    }
}

// Test cases
const testCases = [
    {
        appointmentTime: '10:00',
        travelDurationSeconds: 720, // 12 minutes
        expectedPickupTime: '09:33', // 10:00 - 12 min travel - 15 min buffer
        description: 'Morning appointment with 12-minute travel time'
    },
    {
        appointmentTime: '14:30',
        travelDurationSeconds: 900, // 15 minutes
        expectedPickupTime: '14:00', // 14:30 - 15 min travel - 15 min buffer
        description: 'Afternoon appointment with 15-minute travel time'
    },
    {
        appointmentTime: '08:15',
        travelDurationSeconds: 1800, // 30 minutes
        expectedPickupTime: '07:30', // 08:15 - 30 min travel - 15 min buffer
        description: 'Early appointment with 30-minute travel time'
    },
    {
        appointmentTime: '16:45',
        travelDurationSeconds: 600, // 10 minutes
        expectedPickupTime: '16:20', // 16:45 - 10 min travel - 15 min buffer
        description: 'Evening appointment with 10-minute travel time'
    }
]

console.log('🕒 Testing Pickup Time Calculation Logic\n')

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`)
    console.log(`  Appointment Time: ${testCase.appointmentTime}`)
    console.log(`  Travel Duration: ${testCase.travelDurationSeconds / 60} minutes`)
    
    const calculatedPickupTime = calculatePickupTime(testCase.appointmentTime, testCase.travelDurationSeconds)
    
    console.log(`  Expected Pickup: ${testCase.expectedPickupTime}`)
    console.log(`  Calculated Pickup: ${calculatedPickupTime}`)
    
    const isCorrect = calculatedPickupTime === testCase.expectedPickupTime
    console.log(`  Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`)
    console.log('')
})

console.log('📊 Test Summary:')
console.log('- Pickup time = Appointment time - Travel time - 15 minute buffer')
console.log('- All times are calculated dynamically based on Google Maps API travel duration')
console.log('- Driver will see the calculated pickup time when they claim a ride')
console.log('- This time is automatically saved to Google Sheets column G (pickupTime)')
