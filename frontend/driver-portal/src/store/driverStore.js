import { create } from 'zustand'
import { authService } from '../services/authService'

export const useDriverStore = create((set, get) => ({
  driver: authService.getCurrentDriver(),
  organizationId: null,
  isAuthenticated: authService.isAuthenticated(),

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
}))