import { create } from 'zustand'

export const useRideStore = create((set, get) => ({
    rides: [
        // Fallback data in case Google Sheets is unavailable
        {
            id: 1,
            patientName: 'John Smith',
            patientId: 'P001',
            pickupTime: '9:00 AM',
            appointmentTime: '9:30 AM',
            location: 'Downtown Medical Center',
            status: 'confirmed'
        },
        {
            id: 2,
            patientName: 'Sarah Johnson',
            patientId: 'P002',
            pickupTime: '11:00 AM',
            appointmentTime: '11:30 AM',
            location: 'City Hospital',
            status: 'pending'
        },
        {
            id: 3,
            patientName: 'Mike Wilson',
            patientId: 'P003',
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
        RANGE: window.APP_CONFIG?.RANGE || 'A:G',
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
            
            // Convert rows to ride objects
            const rides = dataRows.map((row, index) => {
                // Handle missing cells in row
                const safeRow = [...row]
                while (safeRow.length < 6) {
                    safeRow.push('')
                }
                
                return {
                    id: safeRow[0] || (index + 1).toString(),
                    patientName: safeRow[1] || '',
                    patientId: safeRow[2] || '',
                    pickupTime: safeRow[3] || '',
                    appointmentTime: safeRow[4] || '',
                    location: safeRow[5] || '',
                    status: safeRow[6] || 'pending'
                }
            }).filter(ride => ride.patientName) // Filter out empty rows

            // Calculate statistics
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

            console.log('Processed rides:', rides)

            set({
                rides,
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
            const upcoming = fallbackRides.filter(ride => ride.status === 'confirmed').length
            const completed = fallbackRides.filter(ride => ride.status === 'completed').length
            const pending = fallbackRides.filter(ride => ride.status === 'pending').length
            
            set({
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
                status: newRide.status || 'pending'
            }

            // Add to local state
            set((state) => ({
                rides: [...state.rides, rideWithId],
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
            // Update local state
            set((state) => ({
                rides: state.rides.map((ride) =>
                    ride.id === id ? { ...ride, status: newStatus } : ride
                )
            }))

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