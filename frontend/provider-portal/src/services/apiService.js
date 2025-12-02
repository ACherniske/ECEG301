// Use environment variable for base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

import api from './api'

class ApiService {
  // Rides
  async fetchRides(orgId) {
    const response = await api.get(`/org/${orgId}/rides`)
    return response.data
  }

  async updateRideStatus(orgId, rideId, status, rowIndex) {
    const response = await api.patch(`/org/${orgId}/rides/${rideId}/status`, {
      status,
      rowIndex
    })
    return response.data
  }

  async addRide(orgId, ride) {
    const response = await api.post(`/org/${orgId}/rides`, ride)
    return response.data
  }

  async updateRide(orgId, rideId, updatedFields, rowIndex) {
    const response = await api.patch(`/org/${orgId}/rides/${rideId}`, {
        ...updatedFields,
        rowIndex
    })
    return response.data
  }

  // Invitations
  async fetchInvitations(orgId) {
    const response = await api.get(`/org/${orgId}/invitations`)
    return response.data
  }

  async createInvitation(orgId, invitation) {
    const response = await api.post(`/org/${orgId}/invitations`, invitation)
    return response.data
  }

  async deleteInvitation(orgId, invitationId) {
    const response = await api.delete(`/org/${orgId}/invitations/${invitationId}`)
    return response.data
  }

  // Users
  async fetchUsers(orgId) {
    const response = await api.get(`/org/${orgId}/users`)
    return response.data
  }

  async deleteUser(orgId, userId) {
    const response = await api.delete(`/org/${orgId}/users/${userId}`)
    return response.data
  }
}

export const apiService = new ApiService()