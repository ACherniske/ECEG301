import { calculateRealDistance, calculateMultipleDistances } from './mapsService.js'

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
        urgencyWeight = 0.2, // Weight for urgency factor (0-1)
        timeOfDayWeight = 0.25, // Weight for time of day preferences (0-1)
        dayOfWeekWeight = 0.15 // Weight for day of week preferences (0-1)
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

        // Factor 4: Time of day preference (based on driver's historical patterns)
        const timeOfDayScore = calculateTimeOfDayFactor(ride, driver)
        factors.timeOfDay = timeOfDayScore
        score += timeOfDayScore.score * timeOfDayWeight

        // Factor 5: Day of week preference (based on driver's historical patterns)
        const dayOfWeekScore = calculateDayOfWeekFactor(ride, driver)
        factors.dayOfWeek = dayOfWeekScore
        score += dayOfWeekScore.score * dayOfWeekWeight

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
 * Calculate time of day preference factor (0-1)
 * Based on driver's historical acceptance patterns for different times of day
 */
function calculateTimeOfDayFactor(ride, driver) {
    try {
        if (!ride.appointmentTime) {
            return {
                score: 0.5,
                timeSlot: 'unknown',
                reason: 'No appointment time available'
            }
        }

        // Parse appointment time (assuming format like "14:30" or "2:30 PM")
        let hour
        if (ride.appointmentTime.includes(':')) {
            const timeParts = ride.appointmentTime.split(':')
            hour = parseInt(timeParts[0])
            
            // Handle AM/PM format
            if (ride.appointmentTime.toLowerCase().includes('pm') && hour !== 12) {
                hour += 12
            } else if (ride.appointmentTime.toLowerCase().includes('am') && hour === 12) {
                hour = 0
            }
        } else {
            return {
                score: 0.5,
                timeSlot: 'unknown',
                reason: 'Invalid time format'
            }
        }

        // Define time slots and their general preference scores
        let timeSlot, baseScore
        
        if (hour >= 6 && hour < 9) {
            timeSlot = 'early_morning'
            baseScore = 0.7 // Many drivers prefer early morning rides
        } else if (hour >= 9 && hour < 12) {
            timeSlot = 'morning'
            baseScore = 0.9 // Peak preference time
        } else if (hour >= 12 && hour < 15) {
            timeSlot = 'afternoon'
            baseScore = 0.8 // Good time for most drivers
        } else if (hour >= 15 && hour < 18) {
            timeSlot = 'late_afternoon'
            baseScore = 0.7 // Moderate preference
        } else if (hour >= 18 && hour < 21) {
            timeSlot = 'evening'
            baseScore = 0.6 // Lower preference for evening
        } else {
            timeSlot = 'night'
            baseScore = 0.3 // Least preferred time
        }

        // Apply driver-specific adjustments based on historical data if available
        const driverPreferences = getDriverTimePreferences(driver, timeSlot)
        const adjustedScore = Math.min(1.0, baseScore + driverPreferences.adjustment)

        return {
            score: adjustedScore,
            timeSlot,
            hour,
            baseScore,
            driverAdjustment: driverPreferences.adjustment,
            acceptanceRate: driverPreferences.acceptanceRate,
            reason: `${timeSlot.replace('_', ' ')} slot (${hour}:00) - ${Math.round(adjustedScore * 100)}% preference`
        }

    } catch (error) {
        console.error('Error calculating time of day factor:', error)
        return {
            score: 0.5,
            timeSlot: 'unknown',
            reason: 'Time preference calculation failed'
        }
    }
}

/**
 * Calculate day of week preference factor (0-1)
 * Based on driver's historical acceptance patterns for different days
 */
function calculateDayOfWeekFactor(ride, driver) {
    try {
        if (!ride.appointmentDate) {
            return {
                score: 0.5,
                dayOfWeek: 'unknown',
                reason: 'No appointment date available'
            }
        }

        const appointmentDate = new Date(ride.appointmentDate)
        const dayOfWeek = appointmentDate.getDay() // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = dayNames[dayOfWeek]

        // Define base preferences for different days
        let baseScore
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        if (isWeekday) {
            // Weekdays generally have higher demand and driver availability
            if (dayOfWeek >= 2 && dayOfWeek <= 4) { // Tuesday-Thursday
                baseScore = 0.9 // Peak weekdays
            } else { // Monday, Friday
                baseScore = 0.8 // Good but slightly lower
            }
        } else {
            // Weekend preferences
            if (dayOfWeek === 6) { // Saturday
                baseScore = 0.6 // Some drivers work weekends
            } else { // Sunday
                baseScore = 0.4 // Lowest preference day
            }
        }

        // Apply driver-specific adjustments based on historical data
        const driverPreferences = getDriverDayPreferences(driver, dayOfWeek, dayName)
        const adjustedScore = Math.min(1.0, baseScore + driverPreferences.adjustment)

        // Consider advance notice for weekend rides
        const now = new Date()
        const hoursUntilRide = (appointmentDate - now) / (1000 * 60 * 60)
        
        if (isWeekend && hoursUntilRide > 48) {
            // Bonus for weekend rides with good advance notice
            const advanceBonus = Math.min(0.2, (hoursUntilRide - 48) / 168 * 0.2) // Up to 0.2 bonus for a week's notice
            return {
                score: Math.min(1.0, adjustedScore + advanceBonus),
                dayOfWeek: dayName,
                isWeekday,
                isWeekend,
                baseScore,
                driverAdjustment: driverPreferences.adjustment,
                advanceBonus,
                acceptanceRate: driverPreferences.acceptanceRate,
                reason: `${dayName} with ${Math.round(hoursUntilRide)}h notice - ${Math.round((adjustedScore + advanceBonus) * 100)}% preference`
            }
        }

        return {
            score: adjustedScore,
            dayOfWeek: dayName,
            isWeekday,
            isWeekend,
            baseScore,
            driverAdjustment: driverPreferences.adjustment,
            acceptanceRate: driverPreferences.acceptanceRate,
            reason: `${dayName} - ${Math.round(adjustedScore * 100)}% preference`
        }

    } catch (error) {
        console.error('Error calculating day of week factor:', error)
        return {
            score: 0.5,
            dayOfWeek: 'unknown',
            reason: 'Day preference calculation failed'
        }
    }
}

/**
 * Get driver's time-of-day preferences based on historical acceptance patterns
 * In a real implementation, this would query historical ride acceptance data
 */
function getDriverTimePreferences(driver, timeSlot) {
    // This would ideally query a database of historical acceptances
    // For now, we'll use some realistic patterns based on driver characteristics
    
    // Mock data based on driver patterns - in production, query actual historical data
    const defaultPreferences = {
        early_morning: { acceptanceRate: 0.65, adjustment: 0.0 },
        morning: { acceptanceRate: 0.85, adjustment: 0.1 },
        afternoon: { acceptanceRate: 0.80, adjustment: 0.05 },
        late_afternoon: { acceptanceRate: 0.70, adjustment: 0.0 },
        evening: { acceptanceRate: 0.55, adjustment: -0.05 },
        night: { acceptanceRate: 0.25, adjustment: -0.2 }
    }

    // Apply driver-specific adjustments if available
    // This could be based on driver profile, past behavior, stated preferences, etc.
    let preferences = defaultPreferences[timeSlot] || { acceptanceRate: 0.5, adjustment: 0.0 }

    // Example: Night shift drivers might prefer evening/night rides
    if (driver.preferredShift === 'night') {
        if (timeSlot === 'evening' || timeSlot === 'night') {
            preferences.adjustment += 0.3
        }
    }

    // Example: Part-time drivers might prefer afternoon/evening
    if (driver.availability === 'part-time') {
        if (timeSlot === 'afternoon' || timeSlot === 'late_afternoon') {
            preferences.adjustment += 0.2
        }
    }

    return {
        acceptanceRate: preferences.acceptanceRate,
        adjustment: Math.max(-0.5, Math.min(0.5, preferences.adjustment)) // Cap adjustments
    }
}

/**
 * Get driver's day-of-week preferences based on historical acceptance patterns
 */
function getDriverDayPreferences(driver, dayOfWeek, dayName) {
    // Default acceptance rates by day (0=Sunday, 6=Saturday)
    const defaultRates = [0.35, 0.80, 0.85, 0.85, 0.85, 0.75, 0.55] // Sun-Sat
    
    let baseAcceptanceRate = defaultRates[dayOfWeek] || 0.5
    let adjustment = 0.0

    // Apply driver-specific patterns
    if (driver.availability === 'weekends-only') {
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
            adjustment += 0.4
        } else {
            adjustment -= 0.6 // Strong preference against weekdays
        }
    } else if (driver.availability === 'weekdays-only') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
            adjustment += 0.2
        } else {
            adjustment -= 0.4 // Preference against weekends
        }
    }

    // Example: Retirees might prefer weekdays
    if (driver.ageGroup === 'senior' || driver.employment === 'retired') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            adjustment += 0.15
        }
    }

    // Example: Students might prefer weekends
    if (driver.employment === 'student') {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            adjustment += 0.25
        }
    }

    return {
        acceptanceRate: baseAcceptanceRate,
        adjustment: Math.max(-0.5, Math.min(0.5, adjustment))
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
    const timeOfDayInfo = factors.timeOfDay?.timeSlot ? ` (${factors.timeOfDay.timeSlot.replace('_', ' ')})` : ''
    const dayOfWeekInfo = factors.dayOfWeek?.dayOfWeek ? ` on ${factors.dayOfWeek.dayOfWeek}` : ''
    
    const score = (factors.distance?.score || 0) + 
                  (factors.time?.score || 0) + 
                  (factors.urgency?.score || 0) +
                  (factors.timeOfDay?.score || 0) +
                  (factors.dayOfWeek?.score || 0)

    let matchQuality
    if (score > 2.5) {
        matchQuality = 'Excellent match'
    } else if (score > 2.0) {
        matchQuality = 'Good match'
    } else if (score > 1.5) {
        matchQuality = 'Fair match'
    } else {
        matchQuality = 'Poor match'
    }

    return `${matchQuality}: ${distanceReason}${timeOfDayInfo}${dayOfWeekInfo}`
}

/**
 * Process multiple rides for a driver and return them sorted by acceptance score
 * Optimized to minimize Google Maps API calls using batch processing
 */
export async function processRidesForDriver(rides, driver, options = {}) {
    console.log(`🔄 Processing ${rides.length} rides for driver acceptance scoring...`)

    if (!driver.address) {
        console.warn('Driver has no address, cannot calculate distances')
        // Return rides with minimal scores
        return {
            rides: rides.map(ride => ({
                ...ride,
                acceptance: {
                    score: 0,
                    rank: 1,
                    factors: { error: 'No driver address' },
                    eligible: false,
                    reason: 'Driver address not available'
                }
            })),
            summary: { totalCount: rides.length, eligibleCount: 0, ineligibleCount: rides.length, averageScore: 0, topScore: 0 }
        }
    }

    // Prepare batch distance requests
    const distanceRequests = rides
        .filter(ride => ride.pickupLocation) // Only rides with pickup locations
        .map(ride => ({
            origin: driver.address,
            destination: ride.pickupLocation,
            rideId: ride.id || ride.rideId
        }))

    console.log(`📏 Batch calculating ${distanceRequests.length} distances...`)

    // Calculate all distances in batch
    const distanceResults = await calculateMultipleDistances(distanceRequests)

    // Create a map of ride ID to distance result
    const distanceMap = new Map()
    distanceRequests.forEach((request, index) => {
        distanceMap.set(request.rideId, distanceResults[index])
    })

    // Process each ride with pre-calculated distances
    const scoredRides = []
    
    for (const ride of rides) {
        try {
            const rideId = ride.id || ride.rideId
            let score = 0
            const factors = {}

            // Distance factor (using pre-calculated result)
            const distanceResult = distanceMap.get(rideId)
            if (distanceResult && ride.pickupLocation) {
                const { maxDistance = 50 } = options
                const distanceMiles = parseFloat(distanceResult.distance?.replace(/[^\d.]/g, '') || '999')
                
                if (distanceMiles > maxDistance) {
                    factors.distance = {
                        score: 0,
                        distance: distanceMiles,
                        duration: distanceResult.duration,
                        totalDistance: calculateTotalTripDistance(ride, distanceMiles).totalDistance,
                        totalTime: calculateTotalTripDistance(ride, distanceMiles).totalTime,
                        reason: `Distance (${distanceMiles} mi) exceeds maximum (${maxDistance} mi)`
                    }
                } else {
                    const normalizedDistance = distanceMiles / maxDistance
                    const distanceScore = Math.max(0.1, 1.0 - normalizedDistance)
                    const totalTripInfo = calculateTotalTripDistance(ride, distanceMiles)
                    
                    factors.distance = {
                        score: distanceScore,
                        distance: distanceMiles,
                        duration: distanceResult.duration,
                        totalDistance: totalTripInfo.totalDistance,
                        totalTime: totalTripInfo.totalTime,
                        reason: `${distanceMiles} miles from driver${totalTripInfo.isRoundTrip ? ` (${totalTripInfo.totalDistance} mi total)` : ''}`
                    }
                    score += distanceScore * (options.distanceWeight || 1.0)
                }
            } else {
                factors.distance = {
                    score: 0.1,
                    distance: 999,
                    reason: 'Missing location data'
                }
            }

            // Time factor
            const timeScore = calculateTimeFactor(ride, driver)
            factors.time = timeScore
            score += timeScore.score * (options.timeWeight || 0.3)

            // Urgency factor
            const urgencyScore = calculateUrgencyFactor(ride)
            factors.urgency = urgencyScore
            score += urgencyScore.score * (options.urgencyWeight || 0.2)

            // Time of day factor
            const timeOfDayScore = calculateTimeOfDayFactor(ride, driver)
            factors.timeOfDay = timeOfDayScore
            score += timeOfDayScore.score * (options.timeOfDayWeight || 0.25)

            // Day of week factor
            const dayOfWeekScore = calculateDayOfWeekFactor(ride, driver)
            factors.dayOfWeek = dayOfWeekScore
            score += dayOfWeekScore.score * (options.dayOfWeekWeight || 0.15)

            // Normalize final score to 0-100 range
            const finalScore = Math.min(Math.max(score * 100, 0), 100)
            const eligible = factors.distance.distance <= (options.maxDistance || 50)

            scoredRides.push({
                ...ride,
                acceptance: {
                    score: finalScore,
                    rank: 0, // Will be set after sorting
                    factors,
                    eligible,
                    reason: getAcceptanceReason(factors, eligible)
                }
            })

        } catch (error) {
            console.error('Error processing ride:', error)
            scoredRides.push({
                ...ride,
                acceptance: {
                    score: 0,
                    rank: 999,
                    factors: { error: error.message },
                    eligible: false,
                    reason: 'Unable to calculate acceptance score'
                }
            })
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
    if (scoredRides.length > 0) {
        console.log(`   📍 Distance range: ${scoredRides[scoredRides.length - 1]?.acceptance.factors.distance?.distance.toFixed(1)} - ${scoredRides[0]?.acceptance.factors.distance?.distance.toFixed(1)} miles`)
    }

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
        timeOfDayWeight: parseFloat(process.env.TIME_OF_DAY_WEIGHT) || 0.25,
        dayOfWeekWeight: parseFloat(process.env.DAY_OF_WEEK_WEIGHT) || 0.15,
        batchSize: parseInt(process.env.PROCESSING_BATCH_SIZE) || 5
    }
}
