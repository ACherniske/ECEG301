/**
 * Distance Caching Service
 * In-memory cache for Google Maps API results
 * Note: Cache is ephemeral in serverless environments
 */

import crypto from 'crypto'

const CACHE_EXPIRY_DAYS = 30
const MAX_CACHE_SIZE = 10000

class DistanceCache {
    constructor() {
        this.cache = new Map()
    }

    /**
     * Generate a cache key from origin and destination
     */
    generateKey(origin, destination) {
        const normalizedOrigin = this.normalizeAddress(origin)
        const normalizedDestination = this.normalizeAddress(destination)
        const addresses = [normalizedOrigin, normalizedDestination].sort()
        return crypto.createHash('md5').update(addresses.join('|')).digest('hex')
    }

    /**
     * Normalize address for better cache matching
     */
    normalizeAddress(address) {
        return address
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[,\s]+$/, '')
            .replace(/^[,\s]+/, '')
            .trim()
    }

    /**
     * Check if cached result exists and is not expired
     */
    get(origin, destination) {
        const key = this.generateKey(origin, destination)
        const cached = this.cache.get(key)
        
        if (!cached) return null
        
        const now = Date.now()
        const expiryTime = cached.timestamp + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        
        if (now > expiryTime) {
            this.cache.delete(key)
            return null
        }

        return cached.result
    }

    /**
     * Store result in cache
     */
    set(origin, destination, result) {
        const key = this.generateKey(origin, destination)
        
        // Implement cache size limit
        if (this.cache.size >= MAX_CACHE_SIZE) {
            const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.1))
            keysToDelete.forEach(k => this.cache.delete(k))
        }

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            origin: this.normalizeAddress(origin),
            destination: this.normalizeAddress(destination)
        })
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: MAX_CACHE_SIZE,
            expiryDays: CACHE_EXPIRY_DAYS
        }
    }

    /**
     * Clear expired entries
     */
    cleanup() {
        const now = Date.now()
        const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        
        let removed = 0
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > expiryTime) {
                this.cache.delete(key)
                removed++
            }
        }
        
        return removed
    }
}

// Singleton instance
const distanceCache = new DistanceCache()

export { distanceCache }
