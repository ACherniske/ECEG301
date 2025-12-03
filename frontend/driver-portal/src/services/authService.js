import api from './api'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/driver/login', {
        email,
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

  async register(formData) {
    try {
      const response = await api.post('/auth/driver/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        driverMake: formData.driverMake,
        driverModel: formData.driverModel
      })
      
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed')
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

  async verifyToken() {
    try {
      const token = this.getToken()
      if (!token) return false

      const response = await api.post('/auth/verify-token', { token })
      return response.data.valid
    } catch (error) {
      // If token verification fails, remove invalid token
      this.clearAuth()
      return false
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
  },

  clearAuth() {
    localStorage.removeItem('driverToken')
    localStorage.removeItem('driver')
  },

  // Check if token is expired (basic check without server call)
  isTokenExpired() {
    const token = this.getToken()
    if (!token) return true

    try {
      // Basic JWT decode to check expiration (not secure, but good for UX)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }
}
