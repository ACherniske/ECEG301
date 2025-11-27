import { create } from 'zustand'
import { rideService } from '../services/rideService'

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

const sortByAppointmentTime = (rides) => {
    return [...rides].sort((a, b) => {
        if (!a.appointmentTime && !b.appointmentTime) return 0
        if (!a.appointmentTime) return 1
        if (!b.appointmentTime) return -1
        
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
    currentOrgId: null,

    fetchRides: async (orgId) => {
        if (get().currentOrgId === orgId && get().allRides.length > 0) {
            return
        }

        set({ isLoading: true, error: null, currentOrgId: orgId })

        try {
            const allRides = await rideService.getRides(orgId)

            const todaysConfirmedRides = allRides.filter(ride => {
                const isConfirmed = ride.status.toLowerCase() === 'confirmed'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isConfirmed && isTodaysRide
            })

            const sortedRides = sortByAppointmentTime(todaysConfirmedRides).slice(0, 3)
            const stats = get().calculateStats(allRides)

            set({
                rides: sortedRides,
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
            const ride = oldAllRides.find(r => r.id === rideId)
            
            if (!ride) {
                throw new Error('Ride not found')
            }

            await rideService.updateRideStatus(orgId, rideId, newStatus, ride.rowIndex)

            set((state) => {
                const updatedAllRides = state.allRides.map((r) => 
                    r.id === rideId ? { ...r, status: newStatus } : r
                )

                const updatedRides = state.rides.map((r) =>
                    r.id === rideId ? { ...r, status: newStatus } : r
                )
                const sortedRides = sortByAppointmentTime(updatedRides)

                const stats = state.calculateStats(updatedAllRides)

                return { 
                    rides: sortedRides,
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
            const result = await rideService.scheduleRide(orgId, {
                ...newRide,
                orgId
            })
            
            await get().fetchRides(orgId)
            return result

        } catch (error) {
            console.error('Error adding ride:', error)
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateRide: async (orgId, rideId, updateFields) => {
        const oldRides = get().rides
        const oldAllRides = get().allRides

        try {
            const ride = oldAllRides.find(r => r.id === rideId)
            
            if (!ride) {
                throw new Error('Ride not found')
            }

            if (ride.orgId !== orgId) {
                throw new Error('Access denied to this ride')
            }

            // Use updateRideFields which includes rowIndex
            await rideService.updateRideFields(orgId, rideId, updateFields, ride.rowIndex)

            set((state) => {
                const updatedAllRides = state.allRides.map((r) => 
                    r.id === rideId ? { ...r, ...updateFields } : r
                )

                const updatedRides = state.rides.map((r) =>
                    r.id === rideId ? { ...r, ...updateFields } : r
                )
                
                const finalRides = updateFields.appointmentTime !== undefined 
                    ? sortByAppointmentTime(updatedRides)
                    : updatedRides

                const stats = state.calculateStats(updatedAllRides)

                return { 
                    rides: finalRides,
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
