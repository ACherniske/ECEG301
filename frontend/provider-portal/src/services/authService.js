import api from './api'

export const authService = {
  //local login
  loginLocal: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user, organization } = response.data
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('organization', JSON.stringify(organization))
      
      return { token, user, organization }
    } catch (error) {
      throw error.response?.data?.message || 'Login failed'
    }
  },

  //google OAuth login
  loginGoogle: async (googleToken) => {
    try {
      const response = await api.post('/auth/google', { token: googleToken })
      const { token, user, organization } = response.data
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('organization', JSON.stringify(organization))
      
      return { token, user, organization }
    } catch (error) {
      throw error.response?.data?.message || 'Google login failed'
    }
  },

  //logout
  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('organization')
  },

  //get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user')
    const organization = localStorage.getItem('organization')
    return {
      user: user ? JSON.parse(user) : null,
      organization: organization ? JSON.parse(organization) : null,
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
      throw error.response?.data?.message || 'Registration failed'
    }
  },

  //get organizations for signup
  getOrganizations: async () => {
    try {
      const response = await api.get('/auth/organizations')
      return response.data
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch organizations'
    }
  },

  //request password reset
    requestPasswordReset: async (email) => {
    try {
      await api.post('/auth/password-reset/request', { email })
    }
    catch (error) {
      throw error.response?.data?.message || 'Password reset request failed'
    }
    },

    //reset password
    resetPassword: async (token, newPassword) => {
      try {
        await api.post('/auth/password-reset/reset', { token, newPassword })
      } catch (error) {
        throw error.response?.data?.message || 'Password reset failed'
      }
    }
}