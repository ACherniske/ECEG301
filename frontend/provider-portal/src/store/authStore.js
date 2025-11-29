import { create } from 'zustand'
import { authService } from '../services/authService'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  organization: null,
  role: null,
  organizationId: null,
  isAuthenticated: false,
  authMethod: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setOrganization: (organization) => set({ organization }),
  setOrganizationId: (organizationId) => set({ organizationId }),
  setAuthMethod: (authMethod) => set({ authMethod }),
  setRole: (role) => set({ role }),

  login: (user, token, organization, authMethod) => set({
    user,
    token,
    organization,
    organizationId: organization?.id,
    role: user?.role,
    isAuthenticated: true,
    authMethod,
  }),

  logout: async () => {
    try {
      // Call the backend logout endpoint
      await authService.logout()
    } catch (error) {
      console.warn('Logout service error:', error)
    } finally {
      // Always clear the store state
      set({
        user: null,
        token: null,
        organization: null,
        organizationId: null,
        role: null,
        isAuthenticated: false,
        authMethod: null,
      })
    }
  },

  // Quick logout without backend call (for cases where token is already invalid)
  forceLogout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('organization')
    
    set({
      user: null,
      token: null,
      organization: null,
      organizationId: null,
      role: null,
      isAuthenticated: false,
      authMethod: null,
    })
  },

  switchOrganization: (organization) => set({
    organization,
    organizationId: organization?.id,
  }),

  updateUser: (updates) => set((state) => ({
    user: { ...state.user, ...updates },
  })),

  // Refresh user data from backend
  refreshUser: async () => {
    try {
      const { user, organization } = await authService.getCurrentUser()
      const currentState = get()
      
      set({
        user,
        organization,
        organizationId: organization?.id,
        role: user?.role,
      })
      
      return { user, organization }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      // If refresh fails, logout the user
      get().forceLogout()
      throw error
    }
  },
}))

// create hard coded admin user for testing
export const useAdminAuthStore = create((set) => ({
    user: { id: 'dev', name: 'Dev User', email: 'dev@example.com', role: 'dev' },
    token: 'dev-token',
    organization: { id: 'org1', name: 'Development Organization' },
    isAuthenticated: true,
    authMethod: 'local',
  }))