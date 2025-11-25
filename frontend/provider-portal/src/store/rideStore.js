import { create } from 'zustand'
import { apiService } from '../services/apiService'

const isToday = (dateString) => {
    if (!dateString) return false
    
    try {
        const today = new Date()
        const checkDate = new Date(dateString)
        
        return today.getDate() === checkDate.getDate() &&
               today.getMonth() === checkDate.getMonth() &&
               today.getFullYear() === checkDate.getFullYear()
    } catch (error) {
        console.error('Error parsing date:', dateString, error)
        return false
    }
}

// Add this helper function at the top of your file, after the isToday function
const sortByAppointmentTime = (rides) => {
    return [...rides].sort((a, b) => {
        // Handle empty or invalid times
        if (!a.appointmentTime && !b.appointmentTime) return 0
        if (!a.appointmentTime) return 1
        if (!b.appointmentTime) return -1
        
        // Convert time strings to comparable format (assuming HH:MM format)
        const timeA = a.appointmentTime.replace(':', '')
        const timeB = b.appointmentTime.replace(':', '')
        
        return timeA.localeCompare(timeB)
    })
}

export const useRideStore = create((set, get) => ({
    rides: [],
    allRides: [],
    upcomingCount: 0,
    completedToday: 0,
    pendingConfirmation: 0,
    isLoading: false,
    error: null,
    currentOrgId: null, // Track which org we're viewing

    // Fetch rides from API for specific org
    fetchRides: async (orgId) => {
        // Only fetch if orgId changed or no data
        if (get().currentOrgId === orgId && get().allRides.length > 0) {
            return
        }

        set({ isLoading: true, error: null, currentOrgId: orgId })

        try {
            const response = await apiService.fetchRides(orgId)
            const allRides = Array.isArray(response) ? response : []

            // Filter for today's confirmed rides only
            const todaysConfirmedRides = allRides.filter(ride => {
                const isConfirmed = ride.status.toLowerCase() === 'confirmed'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isConfirmed && isTodaysRide
            })

            // Sort by appointment time, then take first 3
            const sortedRides = sortByAppointmentTime(todaysConfirmedRides).slice(0, 3)

            const stats = get().calculateStats(allRides)

            set({
                rides: sortedRides, // Now sorted by appointment time
                allRides: allRides,
                ...stats,
                isLoading: false,
                error: null
            })

        } catch (error) {
            console.error('Error fetching rides:', error)
            set({
                rides: [],
                allRides: [],
                isLoading: false,
                error: error.message
            })
        }
    },

    calculateStats: (rides) => {
        const upcoming = rides.filter(ride => {
            const isConfirmedOrScheduled = ride.status.toLowerCase() === 'confirmed' || 
                                         ride.status.toLowerCase() === 'scheduled'
            const isTodaysRide = isToday(ride.appointmentDate)
            return isConfirmedOrScheduled && isTodaysRide
        }).length
        
        const completed = rides.filter(ride => {
            const isCompleted = ride.status.toLowerCase() === 'completed'
            const isTodaysRide = isToday(ride.appointmentDate)
            return isCompleted && isTodaysRide
        }).length
        
        const pending = rides.filter(ride => {
            const isPending = ride.status.toLowerCase() === 'pending'
            const isTodaysRide = isToday(ride.appointmentDate)
            return isPending && isTodaysRide
        }).length

        return {
            upcomingCount: upcoming,
            completedToday: completed,
            pendingConfirmation: pending
        }
    },

    updateRideStatus: async (orgId, rideId, newStatus) => {
        const oldRides = get().rides
        const oldAllRides = get().allRides

        try {
            // Find the ride to get its rowIndex
            const ride = oldAllRides.find(r => r.id === rideId)
            
            if (!ride) {
                throw new Error('Ride not found')
            }

            await apiService.updateRideStatus(orgId, rideId, newStatus, ride.rowIndex)

            // Update local state - keep the ride visible
            set((state) => {
                const updatedAllRides = state.allRides.map((r) => 
                    r.id === rideId ? { ...r, status: newStatus } : r
                )

                // Keep the ride in the displayed list even if status changed, but re-sort
                const updatedRides = state.rides.map((r) =>
                    r.id === rideId ? { ...r, status: newStatus } : r
                )
                const sortedRides = sortByAppointmentTime(updatedRides)

                const stats = state.calculateStats(updatedAllRides)

                return { 
                    rides: sortedRides, // Re-sort after status update
                    allRides: updatedAllRides,
                    ...stats
                }
            })

        } catch (error) {
            console.error('Error updating ride status:', error)
            set({ 
                rides: oldRides,
                allRides: oldAllRides,
                error: error.message 
            })
            throw error
        }
    },

    addRide: async (orgId, newRide) => {
        set({ isLoading: true })

        try {
            const result = await apiService.addRide(orgId, {
                ...newRide,
                orgId // Ensure orgId is included
            })
            
            // Refetch all rides to get updated data
            await get().fetchRides(orgId)

            return result

        } catch (error) {
            console.error('Error adding ride:', error)
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateRide: async (orgId, rideId, updatedRide) => {
        const oldRides = get().rides
        const oldAllRides = get().allRides

        try {
            // Find the ride to get its rowIndex
            const ride = oldAllRides.find(r => r.id === rideId)
            
            if (!ride) {
                throw new Error('Ride not found')
            }

            // Verify ride belongs to current org
            if (ride.orgId !== orgId) {
                throw new Error('Access denied to this ride')
            }

            // Extract only the fields that can be updated
            const updateFields = {}
            if (updatedRide.pickupTime !== undefined) updateFields.pickupTime = updatedRide.pickupTime
            if (updatedRide.appointmentTime !== undefined) updateFields.appointmentTime = updatedRide.appointmentTime
            if (updatedRide.location !== undefined) updateFields.location = updatedRide.location

            await apiService.updateRide(orgId, rideId, updateFields, ride.rowIndex)

            // Update local state - keep the ride visible and re-sort if appointment time changed
            set((state) => {
                const updatedAllRides = state.allRides.map((r) => 
                    r.id === rideId ? { ...r, ...updateFields } : r
                )

                // Update the displayed rides and re-sort if appointment time was changed
                const updatedRides = state.rides.map((r) =>
                    r.id === rideId ? { ...r, ...updateFields } : r
                )
                
                // Re-sort if appointment time was updated
                const finalRides = updateFields.appointmentTime !== undefined 
                    ? sortByAppointmentTime(updatedRides)
                    : updatedRides

                const stats = state.calculateStats(updatedAllRides)

                return { 
                    rides: finalRides, // Re-sorted if needed
                    allRides: updatedAllRides,
                    ...stats
                }
            })

        } catch (error) {
            console.error('Error updating ride:', error)
            set({ 
                rides: oldRides,
                allRides: oldAllRides,
                error: error.message 
            })
            throw error
        }
    },

    // Clear data when switching orgs
    clearData: () => {
        set({
            rides: [],
            allRides: [],
            upcomingCount: 0,
            completedToday: 0,
            pendingConfirmation: 0,
            currentOrgId: null
        })
    }
}))
