import { Client } from '@googlemaps/google-maps-services-js'
import { distanceCache } from './distanceCache.js'

const client = new Client({})

/**
 * Calculate distance between two addresses using Google Maps Distance Matrix API
 * @param {string} origin - Starting address
 * @param {string} destination - Ending address
 * @returns {Promise<{distance: string, duration: string, distanceValue: number, durationValue: number}>}
 */
export async function calculateRealDistance(origin, destination) {
    try {
        if (!origin || !destination) {
            throw new Error('Origin and destination addresses are required')
        }

        // Check cache first
        const cachedResult = distanceCache.get(origin, destination)
        if (cachedResult) {
            return cachedResult
        }

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.warn('Google Maps API key not found, using fallback calculation')
            return fallbackDistanceCalculation(origin, destination)
        }

        console.log(`🗺️  API CALL: Calculating distance ${origin} → ${destination}`)

        const response = await client.distancematrix({
            params: {
                origins: [origin],
                destinations: [destination],
                units: 'imperial', // Use miles
                mode: 'driving',
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        })

        const element = response.data.rows[0]?.elements[0]
        
        if (!element || element.status !== 'OK') {
            console.warn(`Distance calculation failed for ${origin} to ${destination}:`, element?.status)
            return fallbackDistanceCalculation(origin, destination)
        }

        const result = {
            distance: element.distance.text,
            duration: element.duration.text,
            distanceValue: element.distance.value, // in meters
            durationValue: element.duration.value  // in seconds
        }

        // Cache the result
        distanceCache.set(origin, destination, result)

        return result
    } catch (error) {
        console.error('Google Maps API error:', error.message)
        return fallbackDistanceCalculation(origin, destination)
    }
}

/**
 * Calculate multiple distances in a single API call (batch optimization)
 * @param {Array} requests - Array of {origin, destination} objects
 * @returns {Promise<Array>} Array of distance results
 */
export async function calculateMultipleDistances(requests) {
    try {
        if (!requests || requests.length === 0) {
            return []
        }

        // Filter out requests that are already cached
        const uncachedRequests = []
        const results = new Array(requests.length)

        requests.forEach((request, index) => {
            const cached = distanceCache.get(request.origin, request.destination)
            if (cached) {
                results[index] = cached
            } else {
                uncachedRequests.push({ ...request, originalIndex: index })
            }
        })

        if (uncachedRequests.length === 0) {
            console.log(`🎯 All ${requests.length} distances found in cache!`)
            return results
        }

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.warn('Google Maps API key not found, using fallback calculation')
            // Fill in uncached requests with fallback calculations
            for (const request of uncachedRequests) {
                results[request.originalIndex] = fallbackDistanceCalculation(request.origin, request.destination)
            }
            return results
        }

        console.log(`🗺️  BATCH API CALL: ${uncachedRequests.length} distances (${requests.length - uncachedRequests.length} cached)`)

        // Extract unique origins and destinations for batch processing
        const origins = [...new Set(uncachedRequests.map(r => r.origin))]
        const destinations = [...new Set(uncachedRequests.map(r => r.destination))]

        const response = await client.distancematrix({
            params: {
                origins,
                destinations,
                units: 'imperial',
                mode: 'driving',
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        })

        // Process batch results
        for (const request of uncachedRequests) {
            const originIndex = origins.indexOf(request.origin)
            const destIndex = destinations.indexOf(request.destination)
            
            const element = response.data.rows[originIndex]?.elements[destIndex]
            
            let result
            if (element && element.status === 'OK') {
                result = {
                    distance: element.distance.text,
                    duration: element.duration.text,
                    distanceValue: element.distance.value,
                    durationValue: element.duration.value
                }
                // Cache the successful result
                distanceCache.set(request.origin, request.destination, result)
            } else {
                console.warn(`Batch distance calculation failed for ${request.origin} to ${request.destination}:`, element?.status)
                result = fallbackDistanceCalculation(request.origin, request.destination)
            }
            
            results[request.originalIndex] = result
        }

        return results

    } catch (error) {
        console.error('Batch Google Maps API error:', error.message)
        // Fallback to individual calculations
        return requests.map(req => fallbackDistanceCalculation(req.origin, req.destination))
    }
}

/**
 * Calculate total travel distance for a ride including driver pickup and optional round trip
 * @param {string} driverAddress - Driver's starting location
 * @param {string} pickupAddress - Patient pickup location
 * @param {string} providerAddress - Healthcare provider location
 * @param {boolean} isRoundTrip - Whether it's a round trip
 * @returns {Promise<{totalDistance: string, totalDuration: string, legs: Array}>}
 */
export async function calculateTotalRideDistance(driverAddress, pickupAddress, providerAddress, isRoundTrip = false) {
    try {
        const legs = []
        
        // Leg 1: Driver to pickup location
        console.log(`Calculating: Driver (${driverAddress}) → Pickup (${pickupAddress})`)
        const leg1 = await calculateRealDistance(driverAddress, pickupAddress)
        legs.push({
            name: 'Driver to Pickup',
            ...leg1
        })

        // Leg 2: Pickup to provider
        console.log(`Calculating: Pickup (${pickupAddress}) → Provider (${providerAddress})`)
        const leg2 = await calculateRealDistance(pickupAddress, providerAddress)
        legs.push({
            name: 'Pickup to Provider',
            ...leg2
        })

        // Leg 3: Return trip if round trip
        let leg3 = null
        if (isRoundTrip) {
            console.log(`Calculating: Provider (${providerAddress}) → Pickup (${pickupAddress})`)
            leg3 = await calculateRealDistance(providerAddress, pickupAddress)
            legs.push({
                name: 'Provider to Pickup (Return)',
                ...leg3
            })
        }

        // Calculate totals
        const totalDistanceValue = legs.reduce((sum, leg) => sum + (leg.distanceValue || 0), 0)
        const totalDurationValue = legs.reduce((sum, leg) => sum + (leg.durationValue || 0), 0)

        // Convert meters to miles for display
        const totalDistanceMiles = (totalDistanceValue * 0.000621371).toFixed(1)
        const totalDurationMinutes = Math.round(totalDurationValue / 60)

        return {
            totalDistance: `${totalDistanceMiles} mi`,
            totalDuration: `${totalDurationMinutes} min`,
            totalDistanceValue,
            totalDurationValue,
            legs
        }
    } catch (error) {
        console.error('Error calculating total ride distance:', error)
        return fallbackTotalDistanceCalculation(driverAddress, pickupAddress, providerAddress, isRoundTrip)
    }
}

/**
 * Fallback distance calculation when Google Maps API is unavailable
 */
function fallbackDistanceCalculation(origin, destination) {
    console.log(`Using fallback calculation for ${origin} to ${destination}`)
    
    // Simple fallback: random distance between 1-25 miles
    const randomMiles = (Math.random() * 24 + 1).toFixed(1)
    const randomMinutes = Math.round(parseFloat(randomMiles) * 2.5) // Rough estimate: 2.5 min per mile
    
    return {
        distance: `${randomMiles} mi`,
        duration: `${randomMinutes} min`,
        distanceValue: parseFloat(randomMiles) * 1609.34, // Convert to meters
        durationValue: randomMinutes * 60 // Convert to seconds
    }
}

/**
 * Fallback for total distance calculation
 */
function fallbackTotalDistanceCalculation(driverAddress, pickupAddress, providerAddress, isRoundTrip) {
    const leg1 = fallbackDistanceCalculation(driverAddress, pickupAddress)
    const leg2 = fallbackDistanceCalculation(pickupAddress, providerAddress)
    const leg3 = isRoundTrip ? fallbackDistanceCalculation(providerAddress, pickupAddress) : null

    const legs = [
        { name: 'Driver to Pickup', ...leg1 },
        { name: 'Pickup to Provider', ...leg2 }
    ]
    
    if (leg3) {
        legs.push({ name: 'Provider to Pickup (Return)', ...leg3 })
    }

    const totalDistanceValue = legs.reduce((sum, leg) => sum + leg.distanceValue, 0)
    const totalDurationValue = legs.reduce((sum, leg) => sum + leg.durationValue, 0)
    const totalDistanceMiles = (totalDistanceValue * 0.000621371).toFixed(1)
    const totalDurationMinutes = Math.round(totalDurationValue / 60)

    return {
        totalDistance: `${totalDistanceMiles} mi`,
        totalDuration: `${totalDurationMinutes} min`,
        totalDistanceValue,
        totalDurationValue,
        legs
    }
}

/**
 * Get distance to driver (for sorting available rides by proximity)
 * @param {string} driverAddress - Driver's address
 * @param {string} pickupAddress - Ride pickup address
 * @returns {Promise<number>} Distance in miles
 */
export async function getDistanceToDriver(driverAddress, pickupAddress) {
    try {
        const result = await calculateRealDistance(driverAddress, pickupAddress)
        // Convert meters to miles
        return parseFloat((result.distanceValue * 0.000621371).toFixed(1))
    } catch (error) {
        console.error('Error calculating distance to driver:', error)
        return Math.random() * 20 + 1 // Fallback random distance
    }
}
