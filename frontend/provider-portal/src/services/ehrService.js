import api from './api'

export const ehrService = {
  // Search for patient in Google Sheets EHR
  searchPatient: async (organizationId, searchQuery) => {
    try {
      const response = await api.get(
        `/org/${organizationId}/ehr/patients/search`,
        { params: { query: searchQuery } }
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to search patients'
    }
  },

  // Get patient details
  getPatientDetails: async (organizationId, patientId) => {
    try {
      const response = await api.get(
        `/org/${organizationId}/ehr/patients/${patientId}`
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch patient details'
    }
  },

  // Get patient's upcoming appointments
  getPatientAppointments: async (organizationId, patientId) => {
    try {
      const response = await api.get(
        `/org/${organizationId}/ehr/patients/${patientId}/appointments`
      )
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch appointments'
    }
  },

  // Get all patients for an organization (for admin)
  getOrganizationPatients: async (organizationId) => {
    try {
      const response = await api.get(`/org/${organizationId}/ehr/patients`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch patients'
    }
  },
}