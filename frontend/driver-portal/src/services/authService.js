import api from './api'

export const authService = {
  async login(userId, password) {
    try {
      const response = await api.post('/auth/driver/login', {
        userId,
        password
      })
      
      const { driver, token } = response.data
      
      // Store token and driver data
      localStorage.setItem('driverToken', token)
      localStorage.setItem('driver', JSON.stringify(driver))
      
      return { driver, token }
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  },

  async logout() {
    try {
      // Call logout endpoint if available
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear local storage
      localStorage.removeItem('driverToken')
      localStorage.removeItem('driver')
    }
  },

  getCurrentDriver() {
    const driverData = localStorage.getItem('driver')
    return driverData ? JSON.parse(driverData) : null
  },

  getToken() {
    return localStorage.getItem('driverToken')
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}
