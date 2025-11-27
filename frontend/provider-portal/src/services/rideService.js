import api from './api'

export const rideService = {
  // Create new ride request with validation and appointment ID
  scheduleRide: async (organizationId, rideData) => {
    try {
      const rideWithDefaults = {
        ...rideData,
        status: 'pending',
        pickupTime: '', // Empty until calculated by driver/system
        appointmentTime: rideData.appointmentTime,
        appointmentId: rideData.appointmentId, // Include appointment ID
        notes: rideData.notes || '',
        pickupLocation: rideData.pickupLocation || '',
        driverName: rideData.driverName || '',
        driverPlate: rideData.driverPlate || '',
        driverCar: rideData.driverCar || '',
        providerLocation: rideData.providerLocation || rideData.appointmentLocation || '',
        roundTrip: rideData.roundTrip === true || rideData.roundTrip === 'true'
      }
      
      console.log('Scheduling ride with appointment ID:', rideWithDefaults.appointmentId)
      
      const response = await api.post(`/org/${organizationId}/rides`, rideWithDefaults)
      return response.data
    } catch (error) {
      // Handle specific validation errors
      if (error.response?.status === 409 && error.response?.data?.type === 'DUPLICATE_RIDE') {
        const errorData = error.response.data
        throw {
          type: 'DUPLICATE_RIDE',
          message: errorData.error,
          existingRideId: errorData.existingRideId,
          existingRideStatus: errorData.existingRideStatus,
          appointment: errorData.appointment
        }
      }
      
      if (error.response?.status === 400 && error.response?.data?.type === 'PAST_APPOINTMENT') {
        const errorData = error.response.data
        throw {
          type: 'PAST_APPOINTMENT',
          message: errorData.error,
          appointmentDate: errorData.appointmentDate,
          appointmentTime: errorData.appointmentTime
        }
      }
      
      throw error.response?.data?.error || 'Failed to schedule ride'
    }
  },

  // Check if appointment already has a ride (improved with appointment ID)
  checkExistingRide: async (organizationId, patientId, appointmentDate, appointmentTime, appointmentId = null) => {
    try {
      const rides = await rideService.getRides(organizationId)
      
      // First try to match by appointment ID if available
      if (appointmentId) {
        const existingRideById = rides.find(ride => 
          ride.appointmentId === appointmentId &&
          ride.patientId === patientId &&
          ride.status !== 'cancelled' &&
          ride.status !== 'completed'
        )
        
        if (existingRideById) {
          return existingRideById
        }
      }
      
      // Fallback to date/time matching
      const existingRideByDateTime = rides.find(ride => 
        ride.patientId === patientId &&
        ride.appointmentDate === appointmentDate &&
        ride.appointmentTime === appointmentTime &&
        ride.status !== 'cancelled' &&
        ride.status !== 'completed'
      )
      
      return existingRideByDateTime || null
    } catch (error) {
      console.error('Error checking existing ride:', error)
      return null
    }
  },

  // Check if appointment is in the past
  isAppointmentInPast: (appointmentDate, appointmentTime) => {
    if (!appointmentDate) return false
    
    const now = new Date()
    const appointmentDateTime = new Date(appointmentDate)
    
    // If we have time, include it in the comparison
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':')
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    
    return appointmentDateTime < now
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