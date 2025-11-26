import api from './api'

export const ehrService = {
  // Search patients in EHR
  searchPatient: async (organizationId, query) => {
    try {
      const response = await api.get(`/org/${organizationId}/patients/search`, {  // Removed 'ehr'
        params: { query }
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to search patients'
    }
  },

  // Get patient details
  getPatientDetails: async (organizationId, patientId) => {
    try {
      const response = await api.get(`/org/${organizationId}/patients/${patientId}`)  // Removed 'ehr'
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch patient details'
    }
  },

  // Get patient appointments
  getPatientAppointments: async (organizationId, patientId) => {
    try {
      const response = await api.get(`/org/${organizationId}/patients/${patientId}/appointments`)  // Removed 'ehr'
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch appointments'
    }
  }
}