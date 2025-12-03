import { calculateRealDistance } from './mapsService.js'

/**
 * Ride Acceptance Calculation Service
 * 
 * This service determines which rides should be prioritized and shown first
 * to drivers based on various acceptance criteria.
 */

/**
 * Calculate ride acceptance score for a driver
 * Higher scores indicate better ride matches that should be shown first
 * 
 * @param {Object} ride - The ride data
 * @param {Object} driver - The driver data
 * @param {Object} options - Calculation options
 * @returns {Promise<Object>} Ride with acceptance score and ranking data
 */
export async function calculateRideAcceptanceScore(ride, driver, options = {}) {
    const {
        maxDistance = 50, // Max distance in miles to consider
        distanceWeight = 1.0, // Weight for distance factor (0-1)
        timeWeight = 0.3, // Weight for time factor (0-1)
        urgencyWeight = 0.2 // Weight for urgency factor (0-1)
    } = options

    let score = 0
    const factors = {}

    try {
        // Factor 1: Distance to driver (primary factor)
        const distanceScore = await calculateDistanceFactor(ride, driver, maxDistance)
        factors.distance = distanceScore
        score += distanceScore.score * distanceWeight

        // Factor 2: Time compatibility (secondary factor)
        const timeScore = calculateTimeFactor(ride, driver)
        factors.time = timeScore
        score += timeScore.score * timeWeight

        // Factor 3: Ride urgency (tertiary factor)
        const urgencyScore = calculateUrgencyFactor(ride)
        factors.urgency = urgencyScore
        score += urgencyScore.score * urgencyWeight

        // Normalize final score to 0-100 range
        const finalScore = Math.min(Math.max(score * 100, 0), 100)

        return {
            ...ride,
            acceptance: {
                score: finalScore,
                rank: 0, // Will be set during sorting
                factors,
                eligible: distanceScore.distance <= maxDistance,
                reason: getAcceptanceReason(factors, distanceScore.distance <= maxDistance)
            }
        }

    } catch (error) {
        console.error('Error calculating ride acceptance score:', error)
        
        // Return ride with minimal score on error
        return {
            ...ride,
            acceptance: {
                score: 0,
                rank: 999,
                factors: { error: error.message },
                eligible: false,
                reason: 'Unable to calculate acceptance score'
            }
        }
    }
}

/**
 * Calculate distance factor score (0-1)
 * Closer rides get higher scores
 */
async function calculateDistanceFactor(ride, driver, maxDistance) {
    try {
        if (!driver.address || !ride.pickupLocation) {
            return {
                score: 0.1,
                distance: 999,
                reason: 'Missing location data'
            }
        }

        // Calculate actual distance using Google Maps
        const distanceResult = await calculateRealDistance(driver.address, ride.pickupLocation)
        const distanceMiles = parseFloat(distanceResult.distance.replace(/[^\d.]/g, ''))

        if (distanceMiles > maxDistance) {
            return {
                score: 0,
                distance: distanceMiles,
                reason: `Distance (${distanceMiles} mi) exceeds maximum (${maxDistance} mi)`
            }
        }

        // Score inversely proportional to distance
        // 0 miles = 1.0 score, maxDistance miles = 0.1 score
        const normalizedDistance = distanceMiles / maxDistance
        const score = Math.max(0.1, 1.0 - normalizedDistance)

        // Calculate total trip distance including round trip if applicable
        const totalTripInfo = calculateTotalTripDistance(ride, distanceMiles)

        return {
            score,
            distance: distanceMiles,
            duration: distanceResult.duration,
            totalDistance: totalTripInfo.totalDistance,
            totalTime: totalTripInfo.totalTime,
            reason: `${distanceMiles} miles from driver${totalTripInfo.isRoundTrip ? ` (${totalTripInfo.totalDistance} mi total)` : ''}`
        }

    } catch (error) {
        console.error('Error calculating distance factor:', error)
        return {
            score: 0.1,
            distance: 999,
            reason: 'Distance calculation failed'
        }
    }
}

/**
 * Calculate total trip distance and time including round trips
 */
function calculateTotalTripDistance(ride, distanceToPickup) {
    const pickupToDestination = ride.distanceToProvider ? parseFloat(ride.distanceToProvider) : 5 // Default estimate
    const isRoundTrip = ride.roundTrip === 'true' || ride.roundTrip === true
    
    // Total distance: driver to pickup + pickup to destination + (destination to pickup if round trip)
    const totalDistance = distanceToPickup + pickupToDestination + (isRoundTrip ? pickupToDestination : 0)
    
    // Calculate estimated total time (assuming 25 mph average speed + appointment time)
    const drivingTimeMinutes = (totalDistance / 25) * 60 // Convert hours to minutes
    const appointmentTimeMinutes = isRoundTrip ? 60 : 30 // Round trips typically take longer
    const totalTimeMinutes = drivingTimeMinutes + appointmentTimeMinutes
    
    return {
        totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
        totalTime: Math.round(totalTimeMinutes),
        isRoundTrip,
        pickupToDestination
    }
}

/**
 * Calculate time compatibility factor (0-1)
 * Rides at better times for the driver get higher scores
 */
function calculateTimeFactor(ride, driver) {
    try {
        if (!ride.appointmentDate || !ride.appointmentTime) {
            return {
                score: 0.5,
                reason: 'No appointment time data'
            }
        }

        const appointmentDateTime = new Date(`${ride.appointmentDate}T${ride.appointmentTime}`)
        const now = new Date()
        const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60)

        // Score based on advance notice
        let score = 0.5 // baseline score

        if (hoursUntilAppointment < 2) {
            // Very urgent rides get lower score (less planning time)
            score = 0.3
        } else if (hoursUntilAppointment < 24) {
            // Good advance notice
            score = 0.8
        } else if (hoursUntilAppointment < 72) {
            // Optimal planning time
            score = 1.0
        } else {
            // Too far in advance
            score = 0.7
        }

        // Adjust for day of week (weekdays vs weekends)
        const dayOfWeek = appointmentDateTime.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        
        // Slight preference for weekday rides (assuming most drivers prefer weekday work)
        if (!isWeekend) {
            score += 0.1
        }

        return {
            score: Math.min(score, 1.0),
            hoursUntilAppointment: Math.round(hoursUntilAppointment * 10) / 10,
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
            isWeekend,
            reason: `${Math.round(hoursUntilAppointment)}h advance notice, ${isWeekend ? 'weekend' : 'weekday'}`
        }

    } catch (error) {
        console.error('Error calculating time factor:', error)
        return {
            score: 0.5,
            reason: 'Time calculation failed'
        }
    }
}

/**
 * Calculate ride urgency factor (0-1)
 * More urgent rides get higher priority
 */
function calculateUrgencyFactor(ride) {
    try {
        let score = 0.5 // baseline urgency

        // Check for urgent keywords in notes
        const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'immediate']
        const notes = (ride.notes || '').toLowerCase()
        
        if (urgentKeywords.some(keyword => notes.includes(keyword))) {
            score += 0.3
        }

        // Consider appointment type if available
        if (ride.appointmentType) {
            const urgentTypes = ['emergency', 'urgent care', 'dialysis', 'chemotherapy', 'surgery']
            if (urgentTypes.some(type => ride.appointmentType.toLowerCase().includes(type))) {
                score += 0.2
            }
        }

        // Round trip rides might be more urgent (patient needs return transport)
        if (ride.roundTrip === 'true' || ride.roundTrip === true) {
            score += 0.1
        }

        return {
            score: Math.min(score, 1.0),
            isUrgent: score > 0.7,
            reason: score > 0.7 ? 'High priority ride' : 'Standard priority'
        }

    } catch (error) {
        console.error('Error calculating urgency factor:', error)
        return {
            score: 0.5,
            reason: 'Urgency calculation failed'
        }
    }
}

/**
 * Generate human-readable reason for acceptance score
 */
function getAcceptanceReason(factors, eligible) {
    if (!eligible) {
        return factors.distance?.reason || 'Not eligible'
    }

    const distanceReason = factors.distance?.reason || ''
    const score = (factors.distance?.score || 0) + (factors.time?.score || 0) + (factors.urgency?.score || 0)

    if (score > 1.8) {
        return `Excellent match: ${distanceReason}`
    } else if (score > 1.3) {
        return `Good match: ${distanceReason}`
    } else if (score > 0.8) {
        return `Fair match: ${distanceReason}`
    } else {
        return `Poor match: ${distanceReason}`
    }
}

/**
 * Process multiple rides for a driver and return them sorted by acceptance score
 */
export async function processRidesForDriver(rides, driver, options = {}) {
    console.log(`🔄 Processing ${rides.length} rides for driver acceptance scoring...`)

    const scoredRides = []
    const batchSize = 5 // Process in batches to avoid overwhelming the API
    
    for (let i = 0; i < rides.length; i += batchSize) {
        const batch = rides.slice(i, i + batchSize)
        
        const batchPromises = batch.map(ride => 
            calculateRideAcceptanceScore(ride, driver, options)
        )
        
        const batchResults = await Promise.all(batchPromises)
        scoredRides.push(...batchResults)
        
        // Small delay between batches to be API-friendly
        if (i + batchSize < rides.length) {
            await new Promise(resolve => setTimeout(resolve, 200))
        }
    }

    // Sort by acceptance score (highest first)
    scoredRides.sort((a, b) => b.acceptance.score - a.acceptance.score)

    // Assign ranks
    scoredRides.forEach((ride, index) => {
        ride.acceptance.rank = index + 1
    })

    console.log(`✅ Processed ${scoredRides.length} rides with acceptance scoring`)
    console.log(`   🏆 Top ride: ${scoredRides[0]?.acceptance.score.toFixed(1)} points`)
    console.log(`   📍 Distance range: ${scoredRides[scoredRides.length - 1]?.acceptance.factors.distance?.distance.toFixed(1)} - ${scoredRides[0]?.acceptance.factors.distance?.distance.toFixed(1)} miles`)

    return {
        rides: scoredRides,
        summary: {
            totalCount: scoredRides.length,
            eligibleCount: scoredRides.filter(r => r.acceptance.eligible).length,
            ineligibleCount: scoredRides.filter(r => !r.acceptance.eligible).length,
            averageScore: scoredRides.length > 0 ? scoredRides.reduce((sum, r) => sum + r.acceptance.score, 0) / scoredRides.length : 0,
            topScore: scoredRides[0]?.acceptance.score || 0
        }
    }
}

/**
 * Get configuration for ride acceptance calculation
 */
export function getAcceptanceConfig() {
    return {
        maxDistance: parseInt(process.env.MAX_DRIVER_DISTANCE) || 50,
        distanceWeight: parseFloat(process.env.DISTANCE_WEIGHT) || 1.0,
        timeWeight: parseFloat(process.env.TIME_WEIGHT) || 0.3,
        urgencyWeight: parseFloat(process.env.URGENCY_WEIGHT) || 0.2,
        batchSize: parseInt(process.env.PROCESSING_BATCH_SIZE) || 5
    }
}
