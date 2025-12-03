import api from './api'

export const rideService = {
  getAvailableRides: async (organizationId) => {
    try {
      const response = await api.get(`/org/${organizationId}/rides`)
      return response.data.filter(ride => ride.status === 'pending')
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch available rides'
    }
  },

  getMyRides: async (organizationId, driverId) => {
    try {
      const response = await api.get(`/org/${organizationId}/rides`)
      return response.data.filter(ride => 
        ride.driverId === driverId && 
        ['confirmed', 'in-progress'].includes(ride.status)
      )
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch my rides'
    }
  },

  acceptRide: async (organizationId, rideId, driverId, pickupTime, rowIndex) => {
    try {
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}`,
        {
          pickupTime,
          driverId,
          status: 'confirmed',
          rowIndex,
        }
      )
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