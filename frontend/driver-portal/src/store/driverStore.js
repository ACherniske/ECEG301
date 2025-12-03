import { create } from 'zustand'

export const useDriverStore = create((set) => ({
  driver: null,
  organizationId: null,
  isAuthenticated: false,

  setDriver: (driver) => set({ driver }),
  setOrganization: (organizationId) => set({ organizationId }),
  
  login: (driver, organizationId) => set({
    driver,
    organizationId,
    isAuthenticated: true,
  }),

  logout: () => set({
    driver: null,
    organizationId: null,
    isAuthenticated: false,
  }),

  updateDriver: (updates) => set((state) => ({
    driver: { ...state.driver, ...updates },
  })),
}))