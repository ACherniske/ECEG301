import api from './api'

export const rideService = {
  // Create new ride request and save to Google Sheets
  scheduleRide: async (organizationId, rideData) => {
    try {
      const rideWithDefaults = {
        ...rideData,
        status: 'pending',
        pickupTime: '', // Empty until calculated by driver/system
        appointmentTime: rideData.appointmentTime, // Imported appointment time
        notes: rideData.notes || '', // Include notes field
        pickupLocation: rideData.pickupLocation || '',
        driverName: rideData.driverName || '',
        driverPlate: rideData.driverPlate || '',
        driverCar: rideData.driverCar || '',
        providerLocation: rideData.providerLocation || rideData.appointmentLocation || '',
        roundTrip: rideData.roundTrip === true || rideData.roundTrip === 'true'
      }
      
      const response = await api.post(`/org/${organizationId}/rides`, rideWithDefaults)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to schedule ride'
    }
  },

  // Get all rides for organization
  getRides: async (organizationId) => {
    try {
      const response = await api.get(`/org/${organizationId}/rides`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch rides'
    }
  },

  // Get rides for today
  getTodayRides: async (organizationId) => {
    try {
      const response = await api.get(`/org/${organizationId}/rides`)
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      
      return response.data.filter(ride => 
        ride.appointmentDate === todayString
      )
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch today rides'
    }
  },

  // Update ride status
  updateRideStatus: async (organizationId, rideId, status, rowIndex) => {
    try {
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}/status`,
        { status, rowIndex }
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update ride status'
    }
  },

  // Update ride details (supports all new fields)
  updateRide: async (organizationId, rideId, updates) => {
    try {
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}`,
        updates
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update ride'
    }
  },

  // Update multiple ride fields at once
  updateRideFields: async (organizationId, rideId, fields, rowIndex) => {
    try {
      const updateData = { 
        ...fields, 
        rowIndex 
      }
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}`,
        updateData
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update ride fields'
    }
  },

  // Delete ride
  deleteRide: async (organizationId, rideId, rowIndex) => {
    try {
      const response = await api.delete(
        `/org/${organizationId}/rides/${rideId}`,
        { data: { rowIndex } }
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete ride'
    }
  }
}