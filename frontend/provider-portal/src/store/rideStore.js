import { create } from 'zustand'

// Helper function to check if date is today
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

export const useRideStore = create((set, get) => ({
    rides: [
        // Fallback data in case Google Sheets is unavailable
        {
            id: 1,
            patientName: 'John Smith',
            patientId: 'P001',
            appointmentDate: new Date().toISOString().split('T')[0], // Today's date
            pickupTime: '9:00 AM',
            appointmentTime: '9:30 AM',
            location: 'Downtown Medical Center',
            status: 'confirmed'
        },
        {
            id: 2,
            patientName: 'Sarah Johnson',
            patientId: 'P002',
            appointmentDate: new Date().toISOString().split('T')[0], // Today's date
            pickupTime: '11:00 AM',
            appointmentTime: '11:30 AM',
            location: 'City Hospital',
            status: 'confirmed'
        },
        {
            id: 3,
            patientName: 'Mike Wilson',
            patientId: 'P003',
            appointmentDate: new Date().toISOString().split('T')[0], // Today's date
            pickupTime: '2:00 PM',
            appointmentTime: '2:30 PM',
            location: 'Specialty Clinic',
            status: 'confirmed'
        }
    ],
    upcomingCount: 2,
    completedToday: 0,
    pendingConfirmation: 1,
    isLoading: false,
    error: null,

    // Google Sheets configuration
    sheetsConfig: {
        SHEET_ID: window.APP_CONFIG?.GOOGLE_SHEET_ID || 'fallback_id',
        API_KEY: window.APP_CONFIG?.GOOGLE_API_KEY || 'fallback_key',
        SHEET_NAME: window.APP_CONFIG?.SHEET_NAME || 'Rides',
        RANGE: window.APP_CONFIG?.RANGE || 'A:H',
    },

    // Fetch rides from Google Sheets
    fetchRides: async () => {
        set({ isLoading: true, error: null })

        try {
            const { SHEET_ID, API_KEY, SHEET_NAME, RANGE } = get().sheetsConfig
            
            // Construct Google Sheets API URL
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${RANGE}?key=${API_KEY}`
            
            console.log('Fetching from Google Sheets:', url)

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            })

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('API key invalid or quota exceeded')
                } else if (response.status === 404) {
                    throw new Error('Sheet not found - check Sheet ID and name')
                } else {
                    throw new Error(`Google Sheets API error: ${response.status}`)
                }
            }

            const data = await response.json()
            console.log('Google Sheets response:', data)

            // Check if we have data
            if (!data.values || data.values.length === 0) {
                throw new Error('No data found in the sheet')
            }

            const rows = data.values
            
            // Skip header row (assuming first row has headers)
            const dataRows = rows.slice(1)
            
            // Convert rows to ride objects with new column structure
            const allRides = dataRows.map((row, index) => {
                // Handle missing cells in row
                const safeRow = [...row]
                while (safeRow.length < 8) {
                    safeRow.push('')
                }
                
                return {
                    id: safeRow[0] || (index + 1).toString(),
                    patientName: safeRow[1] || '',
                    patientId: safeRow[2] || '',
                    appointmentDate: safeRow[3] || '',
                    pickupTime: safeRow[4] || '',
                    appointmentTime: safeRow[5] || '',
                    location: safeRow[6] || '',
                    status: safeRow[7] || 'pending'
                }
            }).filter(ride => ride.patientName) // Filter out empty rows

            // Filter for today's confirmed rides only
            const todaysConfirmedRides = allRides.filter(ride => {
                const isConfirmed = ride.status.toLowerCase() === 'confirmed'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isConfirmed && isTodaysRide
            })

            // Limit to 3 rides maximum
            const displayRides = todaysConfirmedRides.slice(0, 3)

            console.log('All rides from sheet:', allRides.length)
            console.log('Today\'s confirmed rides:', todaysConfirmedRides.length)
            console.log('Displaying (max 3):', displayRides.length)
            console.log('Processed rides:', displayRides)

            // Calculate statistics from all rides (not just displayed ones)
            const upcoming = allRides.filter(ride => {
                const isConfirmedOrScheduled = ride.status.toLowerCase() === 'confirmed' || 
                                             ride.status.toLowerCase() === 'scheduled'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isConfirmedOrScheduled && isTodaysRide
            }).length
            
            const completed = allRides.filter(ride => {
                const isCompleted = ride.status.toLowerCase() === 'completed'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isCompleted && isTodaysRide
            }).length
            
            const pending = allRides.filter(ride => {
                const isPending = ride.status.toLowerCase() === 'pending'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isPending && isTodaysRide
            }).length

            console.log('Statistics calculation:')
            console.log('- Upcoming (today only):', upcoming)
            console.log('- Completed (today only):', completed)
            console.log('- Pending (today only):', pending)

            set({
                rides: displayRides, // Only today's confirmed rides (max 3)
                upcomingCount: upcoming,
                completedToday: completed,
                pendingConfirmation: pending,
                isLoading: false,
                error: null
            })

        } catch (error) {
            console.error('Error fetching from Google Sheets:', error)
            
            // Fall back to local data on error
            const fallbackRides = get().rides
            
            // Filter fallback data for today's confirmed rides
            const todaysConfirmed = fallbackRides.filter(ride => {
                const isConfirmed = ride.status === 'confirmed'
                const isTodaysRide = isToday(ride.appointmentDate)
                return isConfirmed && isTodaysRide
            }).slice(0, 3)

            const upcoming = fallbackRides.filter(ride => ride.status === 'confirmed').length
            const completed = fallbackRides.filter(ride => ride.status === 'completed').length
            const pending = fallbackRides.filter(ride => ride.status === 'pending').length
            
            set({
                rides: todaysConfirmed,
                upcomingCount: upcoming,
                completedToday: completed,
                pendingConfirmation: pending,
                isLoading: false,
                error: `Failed to load from Google Sheets: ${error.message}`
            })
        }
    },

    // Add new ride (local only - Google Sheets API doesn't support writing without OAuth)
    addRide: async (newRide) => {
        set({ isLoading: true })

        try {
            // Generate new ID
            const existingIds = get().rides.map(ride => parseInt(ride.id)).filter(id => !isNaN(id))
            const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1

            const rideWithId = {
                ...newRide,
                id: newId.toString(),
                appointmentDate: newRide.appointmentDate || new Date().toISOString().split('T')[0],
                status: newRide.status || 'pending'
            }

            // Only add to displayed list if it's today's confirmed ride and we have less than 3
            const currentRides = get().rides
            let updatedRides = [...currentRides]

            const isConfirmedToday = rideWithId.status === 'confirmed' && isToday(rideWithId.appointmentDate)
            
            if (isConfirmedToday && currentRides.length < 3) {
                updatedRides.push(rideWithId)
            }

            set((state) => ({
                rides: updatedRides,
                isLoading: false
            }))

            // Recalculate stats
            get().recalculateStats()

            console.log('Note: New ride added locally. To persist to Google Sheets, you need to manually add it or implement Google Apps Script')

        } catch (error) {
            console.error('Error adding ride:', error)
            set({ error: error.message, isLoading: false })
        }
    },

    // Update ride status (local only)
    updateRideStatus: async (id, newStatus) => {
        const oldRides = get().rides

        try {
            // Update local state - remove from display if no longer confirmed
            set((state) => {
                const updatedRides = state.rides.map((ride) => {
                    if (ride.id === id) {
                        return { ...ride, status: newStatus }
                    }
                    return ride
                }).filter(ride => {
                    // Keep only today's confirmed rides
                    return ride.status === 'confirmed' && isToday(ride.appointmentDate)
                }).slice(0, 3) // Maintain max 3 limit

                return { rides: updatedRides }
            })

            // Recalculate stats
            get().recalculateStats()

            console.log('Note: Status updated locally. To persist to Google Sheets, you need to manually update or implement Google Apps Script')

        } catch (error) {
            console.error('Error updating ride status:', error)
            // Revert on error
            set({ rides: oldRides, error: error.message })
        }
    },

    // Helper function to recalculate statistics
    recalculateStats: () => {
        const rides = get().rides
        const upcoming = rides.filter(ride => 
            ride.status.toLowerCase() === 'confirmed' || 
            ride.status.toLowerCase() === 'scheduled'
        ).length
        
        const completed = rides.filter(ride => 
            ride.status.toLowerCase() === 'completed'
        ).length
        
        const pending = rides.filter(ride => 
            ride.status.toLowerCase() === 'pending'
        ).length

        set({
            upcomingCount: upcoming,
            completedToday: completed,
            pendingConfirmation: pending
        })
    },

    // Update configuration
    updateConfig: (newConfig) => {
        set((state) => ({
            sheetsConfig: { ...state.sheetsConfig, ...newConfig }
        }))
    }
}))