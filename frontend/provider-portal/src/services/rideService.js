import api from './api'

export const rideService = {
  // Create new ride request and save to Google Sheets
  scheduleRide: async (organizationId, rideData) => {
    try {
      const response = await api.post(`/org/${organizationId}/rides`, rideData)
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

  // Update ride details
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

  // Update ride notes specifically
  updateRideNotes: async (organizationId, rideId, notes, rowIndex) => {
    try {
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}`,
        { notes, rowIndex }
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update ride notes'
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
  },

  // Get driver accounts from DriverAccounts sheet
  getDriverAccounts: async (organizationId) => {
    try {
      const response = await api.get(`/org/${organizationId}/drivers`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch driver accounts'
    }
  },

  // Get transportation types from driver vehicles (dynamic based on available drivers)
  getTransportationTypes: async (organizationId) => {
    try {
      const drivers = await this.getDriverAccounts(organizationId)
      return drivers.map(driver => ({
        id: driver.id || `${driver.make}-${driver.model}-${driver.licensePlate}`,
        label: `${driver.make} ${driver.model} (${driver.licensePlate})`,
        driverId: driver.id,
        make: driver.make,
        model: driver.model,
        licensePlate: driver.licensePlate
      }))
    } catch (error) {
      // Fallback to default types if driver data unavailable
      return [
        { id: 'standard', label: 'Standard Vehicle' },
        { id: 'wheelchair', label: 'Wheelchair Accessible' },
        { id: 'stretcher', label: 'Stretcher Transport' },
        { id: 'bariatric', label: 'Bariatric' },
      ]
    }
  },

  // Create new ride request with Pending status, empty pickup time, and optional notes
  scheduleRide: async (organizationId, rideData) => {
    try {
      const rideWithDefaults = {
        ...rideData,
        status: 'Pending',
        pickupTime: '', // Empty until calculated by driver/system
        appointmentTime: rideData.appointmentTime, // Imported appointment time
        notes: rideData.notes || '', // Include notes field, default to empty string
      }
      
      const response = await api.post(`/org/${organizationId}/rides`, rideWithDefaults)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to schedule ride'
    }
  },

  // Update multiple ride fields at once (pickupTime, appointmentTime, location, notes)
  updateRideFields: async (organizationId, rideId, fields, rowIndex) => {
    try {
      const updateData = { ...fields, rowIndex }
      const response = await api.patch(
        `/org/${organizationId}/rides/${rideId}`,
        updateData
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update ride fields'
    }
  },
}