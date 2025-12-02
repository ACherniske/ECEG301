import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useAuthStore } from './store/authStore'
import { authService } from './services/authService'
import LoginPage from './pages/LoginPage'
import OrgDashboardPage from './pages/org/OrgDashboardPage'
import OrgSettingsPage from './pages/org/OrgSettingsPage'
import OrgProfilePage from './pages/org/OrgProfilePage'
import OrgScheduleRidePage from './pages/org/OrgScheduleRidePage'
import OrgRideHistoryPage from './pages/org/OrgRideHistoryPage'
import OrgAdminPage from './pages/org/OrgAdminPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import RideConfirmationPage from './pages/RideConfirmationPage'

import './index.css'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Organization route wrapper
function OrgRoute({ children }) {
  const { user, organizationId } = useAuthStore()
  
  if (!user || !organizationId) {
    return <Navigate to="/login" />
  }
  
  return children
}

// Debug component to log current location
function LocationLogger() {
  const location = useLocation()
  
  useEffect(() => {
    console.log('=== ROUTER DEBUG ===')
    console.log('Current location:', location.pathname)
    console.log('Full location:', location)
    console.log('VITE_BASE_PATH:', import.meta.env.VITE_BASE_PATH)
    console.log('Is DEV:', import.meta.env.DEV)
    console.log('Is PROD:', import.meta.env.PROD)
    console.log('NODE_ENV:', import.meta.env.NODE_ENV)
    console.log('All env vars:', import.meta.env)
    console.log('==================')
  }, [location.pathname])
  
  return null
}

function AppRoutes() {
  const [loading, setLoading] = useState(true)
  const { login, logout, isAuthenticated, organizationId } = useAuthStore()

  useEffect(() => {
    // Initialize auth from stored data and verify token
    const initializeAuth = async () => {
      try {
        const { user, organization, token } = authService.getStoredUser()
        
        if (token && user && organization) {
          try {
            // Verify token is still valid by getting current user info
            const currentUserData = await authService.getCurrentUser()
            
            // Login with verified user data
            login(currentUserData.user, token, currentUserData.organization, 'local')
          } catch (error) {
            console.warn('Token verification failed:', error.message)
            // Clear invalid data
            logout()
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            localStorage.removeItem('organization')
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [login, logout])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-blue-600 animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router basename={import.meta.env.PROD ? '/ECEG301' : ''}>
      <LocationLogger />
      <Routes>
        {/* Root route - must be first for proper matching */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={isAuthenticated && organizationId ? `/org/${organizationId}/dashboard` : '/login'} 
              replace 
            />
          } 
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={`/org/${organizationId}/dashboard`} /> : <LoginPage />}
        />
        <Route
          path="/accept-invitation"
          element={<AcceptInvitationPage />}
        />
        <Route
          path="/confirm-ride"
          element={<RideConfirmationPage />}
        />

        {/* Organization Routes */}
        <Route
          path="/org/:orgId/dashboard"
          element={
            <OrgRoute>
              <OrgDashboardPage />
            </OrgRoute>
          }
        />
        <Route
          path="/org/:orgId/schedule-ride"
          element={
            <OrgRoute>
              <OrgScheduleRidePage />
            </OrgRoute>
          }
        />
        <Route
          path="/org/:orgId/ride-history"
          element={
            <OrgRoute>
              <OrgRideHistoryPage />
            </OrgRoute>
          }
        />
        <Route
          path="/org/:orgId/admin"
          element={
            <OrgRoute>
              <OrgAdminPage />
            </OrgRoute>
          }
        />
        <Route
          path="/org/:orgId/profile"
          element={
            <OrgRoute>
              <OrgProfilePage />
            </OrgRoute>
          }
        />
        <Route
          path="/org/:orgId/settings"
          element={
            <OrgRoute>
              <OrgSettingsPage />
            </OrgRoute>
          }
        />

        {/* Catch all unmatched routes */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={isAuthenticated && organizationId ? `/org/${organizationId}/dashboard` : '/login'} 
              replace 
            />
          } 
        />
      </Routes>
    </Router>
  )
}

function App() {
  const googleClientId = window.APP_CONFIG?.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'YOUR_GOOGLE_CLIENT_ID'}>
      <AppRoutes />
    </GoogleOAuthProvider>
  )
}

export default App