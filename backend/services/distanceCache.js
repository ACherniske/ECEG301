/**
 * Distance Caching Service
 * Caches Google Maps API results to minimize API calls
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const CACHE_FILE = path.join(process.cwd(), 'data', 'distance-cache.json')
const CACHE_EXPIRY_DAYS = 30 // Cache distances for 30 days
const MAX_CACHE_SIZE = 10000 // Maximum number of cached entries

class DistanceCache {
    constructor() {
        this.cache = new Map()
        this.loadCache()
    }

    /**
     * Generate a cache key from origin and destination
     */
    generateKey(origin, destination) {
        // Normalize addresses to improve cache hits
        const normalizedOrigin = this.normalizeAddress(origin)
        const normalizedDestination = this.normalizeAddress(destination)
        
        // Create bidirectional key (A->B same as B->A for distance)
        const addresses = [normalizedOrigin, normalizedDestination].sort()
        return crypto.createHash('md5').update(addresses.join('|')).digest('hex')
    }

    /**
     * Normalize address for better cache matching
     */
    normalizeAddress(address) {
        return address
            .toLowerCase()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[,\s]+$/, '') // Remove trailing commas and spaces
            .replace(/^[,\s]+/, '') // Remove leading commas and spaces
            .trim()
    }

    /**
     * Check if cached result exists and is not expired
     */
    get(origin, destination) {
        const key = this.generateKey(origin, destination)
        const cached = this.cache.get(key)
        
        if (!cached) return null
        
        // Check if cache entry is expired
        const now = Date.now()
        const expiryTime = cached.timestamp + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        
        if (now > expiryTime) {
            this.cache.delete(key)
            return null
        }

        console.log(`🎯 Cache HIT: ${origin} ↔ ${destination} (${cached.result.distance})`)
        return cached.result
    }

    /**
     * Store result in cache
     */
    set(origin, destination, result) {
        const key = this.generateKey(origin, destination)
        
        // Implement cache size limit
        if (this.cache.size >= MAX_CACHE_SIZE) {
            // Remove oldest entries (basic LRU-like behavior)
            const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.1))
            keysToDelete.forEach(k => this.cache.delete(k))
        }

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            origin: this.normalizeAddress(origin),
            destination: this.normalizeAddress(destination)
        })

        console.log(`💾 Cache STORED: ${origin} ↔ ${destination} (${result.distance})`)
        
        // Periodically save to disk
        this.saveCache()
    }

    /**
     * Load cache from disk
     */
    async loadCache() {
        try {
            // Ensure data directory exists
            await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
            
            const data = await fs.readFile(CACHE_FILE, 'utf8')
            const cacheData = JSON.parse(data)
            
            // Convert array back to Map
            this.cache = new Map(cacheData)
            console.log(`📂 Loaded ${this.cache.size} cached distance entries`)
        } catch (error) {
            // File doesn't exist or is corrupted, start with empty cache
            console.log('📂 Starting with empty distance cache')
            this.cache = new Map()
        }
    }

    /**
     * Save cache to disk
     */
    async saveCache() {
        try {
            // Convert Map to array for JSON serialization
            const cacheData = Array.from(this.cache.entries())
            await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2))
        } catch (error) {
            console.warn('Failed to save distance cache:', error.message)
        }
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
        
        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} expired cache entries`)
            this.saveCache()
        }
        
        return removed
    }
}

// Singleton instance
const distanceCache = new DistanceCache()

export { distanceCache }
