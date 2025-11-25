import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useAuthStore } from './store/authStore'
import { authService } from './services/authService'
import { OrgProtectedRoute } from './components/auth/OrgProtectedRoute'
import LoginPage from './pages/LoginPage'
import OrgDashboardPage from './pages/org/OrgDashboardPage'
import OrgSettingsPage from './pages/org/OrgSettingsPage'
import OrgProfilePage from './pages/org/OrgProfilePage'
import OrgScheduleRidePage from './pages/org/OrgScheduleRidePage'
import OrgRideHistoryPage from './pages/org/OrgRideHistoryPage'
import OrgAdminPage from './pages/org/OrgAdminPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import './index.css'

function AppRoutes() {
  const [loading, setLoading] = useState(true)
  const { login, isAuthenticated, organizationId } = useAuthStore()

  useEffect(() => {
    // Initialize auth from stored data
    const { user, organization } = authService.getStoredUser()
    const token = localStorage.getItem('authToken')

    if (token && user) {
      login(user, token, organization, 'local')
    }
    setLoading(false)
  }, [login])

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
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={`/org/${organizationId}/dashboard`} /> : <LoginPage />}
        />

        {/* Redirect to organization dashboard if trying to access old routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated && organizationId ? <Navigate to={`/org/${organizationId}/dashboard`} /> : <Navigate to="/login" />}
        />

        {/* Organization Routes */}
        <Route
          path="/org/:orgId/dashboard"
          element={
            <OrgProtectedRoute>
              <OrgDashboardPage />
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/org/:orgId/schedule-ride"
          element={
            <OrgProtectedRoute>
              <OrgScheduleRidePage />
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/org/:orgId/ride-history"
          element={
            <OrgProtectedRoute>
              <OrgRideHistoryPage />
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/org/:orgId/profile"
          element={
            <OrgProtectedRoute>
              <OrgProfilePage />
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/org/:orgId/settings"
          element={
            <OrgProtectedRoute>
              <OrgSettingsPage />
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/accept-invitation"
          element={<AcceptInvitationPage />}
        />
        <Route
          path="/org/:orgId/admin"
          element={
            <OrgProtectedRoute>
              <OrgAdminPage />
            </OrgProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="/" element={<Navigate to={isAuthenticated && organizationId ? `/org/${organizationId}/dashboard` : '/login'} />} />
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