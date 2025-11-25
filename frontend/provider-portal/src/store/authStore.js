import { create } from 'zustand'

export const useAuthStore = create((set) => ({
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

  logout: () => set({
    user: null,
    token: null,
    organization: null,
    organizationId: null,
    role: null,
    isAuthenticated: false,
    authMethod: null,
  }),

  switchOrganization: (organization) => set({
    organization,
    organizationId: organization?.id,
  }),

  updateUser: (updates) => set((state) => ({
    user: { ...state.user, ...updates },
  })),
}))

// create hard coded admin user for testing
export const useAdminAuthStore = create((set) => ({
    user: { id: 'admin', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    token: 'admin-token',
    organization: { id: 'org1', name: 'Admin Organization' },
    isAuthenticated: true,
    authMethod: 'local',
  }))