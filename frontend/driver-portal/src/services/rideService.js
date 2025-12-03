import api from './api'

export const rideService = {
  getAvailableRides: async (organizationId) => {
    try {
      const response = await api.get(`/driver/rides`)
      // Return the full response which may include rides array and summary
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch available rides'
    }
  },

  getMyRides: async (organizationId, driverId) => {
    try {
      const response = await api.get(`/driver/rides`)
      // Filter for accepted rides for this driver
      const rides = Array.isArray(response.data) ? response.data : (response.data.rides || [])
      return rides.filter(ride => 
        ride.driverId === driverId && 
        ['confirmed', 'in-progress'].includes(ride.status)
      )
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch my rides'
    }
  },

  acceptRide: async (rideId) => {
    try {
      const response = await api.patch(`/driver/rides/${rideId}/accept`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to accept ride'
    }
  },

  startRide: async (organizationId, rideId, rowIndex) => {
    try {
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}/status`,
        {
          status: 'in-progress',
          rowIndex,
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to start ride'
    }
  },

  completeRide: async (organizationId, rideId, rowIndex) => {
    try {
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}/status`,
        {
          status: 'completed',
          rowIndex,
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to complete ride'
    }
  },
}