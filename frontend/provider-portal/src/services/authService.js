import api from './api'

export const authService = {
  //local login
  loginLocal: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user, organization, success } = response.data
      
      if (!success || !token) {
        throw new Error('Invalid login response')
      }

      // Store authentication data
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('organization', JSON.stringify(organization))
      
      return { token, user, organization }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed'
      throw new Error(errorMessage)
    }
  },

  //google OAuth login (currently using same endpoint for demo)
  loginGoogle: async (googleToken) => {
    try {
      // Note: This would need to be updated when Google OAuth is properly implemented in backend
      const response = await api.post('/auth/google', { token: googleToken })
      const { token, user, organization } = response.data
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('organization', JSON.stringify(organization))
      
      return { token, user, organization }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Google login failed'
      throw new Error(errorMessage)
    }
  },

  //logout
  logout: async () => {
    try {
      // Call backend logout endpoint (if token is still valid)
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          // Ignore logout errors - we'll clear local storage anyway
          console.warn('Backend logout failed:', error.message)
        }
      }
    } catch (error) {
      console.warn('Logout error:', error)
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem('organization')
    }
  },

  //get stored user data from localStorage
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user')
      const organization = localStorage.getItem('organization')
      const token = localStorage.getItem('authToken')
      
      return {
        user: user ? JSON.parse(user) : null,
        organization: organization ? JSON.parse(organization) : null,
        token
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error)
      // Clear corrupted data
      localStorage.removeItem('user')
      localStorage.removeItem('organization')
      localStorage.removeItem('authToken')
      return { user: null, organization: null, token: null }
    }
  },

  //get current user info from backend (validates token)
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      const { user, organization } = response.data
      
      // Update local storage with fresh data
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('organization', JSON.stringify(organization))
      
      return { user, organization }
    } catch (error) {
      // If token is invalid, clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem('organization')
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to get user info'
      throw new Error(errorMessage)
    }
  },

  //verify token validity
  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify-token', { token })
      return response.data
    } catch (error) {
      return { valid: false, error: error.message }
    }
  },

  //change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Password change failed'
      throw new Error(errorMessage)
    }
  },

  //register new user
  register: async (email, password, firstName, lastName, organizationId) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        organizationId,
      })
      const { token, user, organization } = response.data
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('organization', JSON.stringify(organization))
      
      return { token, user, organization }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed'
      throw new Error(errorMessage)
    }
  },

  //get organizations for signup
  getOrganizations: async () => {
    try {
      const response = await api.get('/auth/organizations')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch organizations'
      throw new Error(errorMessage)
    }
  },

  //request password reset
  requestPasswordReset: async (email) => {
    try {
      await api.post('/auth/password-reset/request', { email })
    }
    catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Password reset request failed'
      throw new Error(errorMessage)
    }
  },

  //reset password
  resetPassword: async (token, newPassword) => {
    try {
      await api.post('/auth/password-reset/reset', { token, newPassword })
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Password reset failed'
      throw new Error(errorMessage)
    }
  }
}