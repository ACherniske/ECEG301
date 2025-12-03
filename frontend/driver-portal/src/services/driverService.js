import api from './api'

export const driverService = {
  // Get driver profile
  async getProfile() {
    try {
      const response = await api.get('/driver/profile')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch profile')
    }
  },

  // Get available rides for claiming
  async getAvailableRides() {
    try {
      const response = await api.get('/driver/rides')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch available rides')
    }
  },

  // Get driver's assigned rides
  async getMyRides() {
    try {
      const response = await api.get('/driver/rides/my')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch my rides')
    }
  },

  // Claim a ride
  async claimRide(rideId) {
    try {
      const response = await api.post(`/driver/rides/${rideId}/claim`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to claim ride')
    }
  },

  // Update ride status
  async updateRideStatus(rideId, status) {
    try {
      const response = await api.put(`/driver/rides/${rideId}/status`, { status })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update ride status')
    }
  }
}
