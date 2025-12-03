import { create } from 'zustand'
import { authService } from '../services/authService'

export const useDriverStore = create((set, get) => ({
  driver: authService.getCurrentDriver(),
  organizationId: null,
  isAuthenticated: authService.isAuthenticated() && !authService.isTokenExpired(),

  setDriver: (driver) => set({ driver }),
  setOrganization: (organizationId) => set({ organizationId }),
  
  login: (driver, organizationId) => set({
    driver,
    organizationId,
    isAuthenticated: true,
  }),

  logout: async () => {
    await authService.logout()
    set({
      driver: null,
      organizationId: null,
      isAuthenticated: false,
    })
  },

  updateDriver: (updates) => set((state) => ({
    driver: { ...state.driver, ...updates },
  })),

  // Validate authentication status
  async validateAuth() {
    const currentState = get()
    
    // If not authenticated in store, return false
    if (!currentState.isAuthenticated) {
      return false
    }

    // Check if token is expired
    if (authService.isTokenExpired()) {
      set({ isAuthenticated: false, driver: null })
      authService.clearAuth()
      return false
    }

    // Verify with server
    const isValid = await authService.verifyToken()
    if (!isValid) {
      set({ isAuthenticated: false, driver: null })
      return false
    }

    return true
  },

  // Initialize store from localStorage
  initializeAuth: () => {
    const driver = authService.getCurrentDriver()
    const isAuthenticated = authService.isAuthenticated() && !authService.isTokenExpired()
    
    set({
      driver,
      isAuthenticated
    })
  }
}))