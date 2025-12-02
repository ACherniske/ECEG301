import axios from 'axios'

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized responses
    if (error.response?.status === 401) {
      // Don't redirect on login or auth-related endpoints
      const authEndpoints = ['/auth/login', '/auth/register', '/auth/verify-token']
      const isAuthEndpoint = authEndpoints.some(endpoint => 
        originalRequest.url?.includes(endpoint)
      )

      if (!isAuthEndpoint) {
        // Clear local storage
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        localStorage.removeItem('organization')
        
        // Redirect to login page with proper base path
        if (window.location.pathname !== '/login') {
          const basePath = import.meta.env.PROD ? '/ECEG301' : ''
          window.location.href = `${basePath}/login?expired=true`
        }
      }
    }

    // Handle 403 Forbidden responses
    if (error.response?.status === 403) {
      console.warn('Access denied:', error.response.data?.message || 'Insufficient permissions')
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('Network error:', error.message)
      error.message = 'Network error. Please check your connection and try again.'
    }

    return Promise.reject(error)
  }
)

export default api