import api from './api'

export const rideService = {
  getAvailableRides: async () => {
    try {
      const response = await api.get(`/driver/rides`)
      // Return the full response which may include rides array and summary
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch available rides'
    }
  },

  getMyRides: async () => {
    try {
      const response = await api.get(`/driver/rides/my`)
      // Return rides assigned to current driver
      return Array.isArray(response.data) ? response.data : []
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

  updateRideStatus: async (rideId, status, cancellationReason = null) => {
    try {
      const payload = { status }
      if (cancellationReason) {
        payload.cancellationReason = cancellationReason
      }
      
      const response = await api.put(`/driver/rides/${rideId}/status`, payload)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update ride status'
    }
  },

  startRide: async (rideId) => {
    try {
      const response = await api.put(`/driver/rides/${rideId}/status`, { status: 'en route' })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to start ride'
    }
  },

  cancelRide: async (rideId, reason) => {
    try {
      const payload = { status: 'cancelled' }
      if (reason) payload.cancellationReason = reason
      const response = await api.put(`/driver/rides/${rideId}/status`, payload)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to cancel ride'
    }
  },

  completeRide: async (rideId) => {
    try {
      const response = await api.put(`/driver/rides/${rideId}/status`, { status: 'completed' })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to complete ride'
    }
  },

  getRideHistory: async () => {
    try {
      // Get all driver's rides and filter for completed
      const response = await api.get(`/driver/rides/my`)
      const allRides = Array.isArray(response.data) ? response.data : []
      return allRides.filter(ride => ride.status === 'completed')
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch ride history'
    }
  },
}