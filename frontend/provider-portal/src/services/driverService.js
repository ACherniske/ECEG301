import api from './api'

export const driverService = {
  // Get driver accounts for organization
  getDrivers: async (organizationId) => {
    try {
      const response = await api.get(`/org/${organizationId}/drivers`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch drivers'
    }
  },

  // Get driver details by ID
  getDriverById: async (organizationId, driverId) => {
    try {
      const drivers = await driverService.getDrivers(organizationId)
      const driver = drivers.find(d => d.id === driverId)
      
      if (!driver) {
        throw new Error('Driver not found')
      }
      
      return driver
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch driver details'
    }
  }
}