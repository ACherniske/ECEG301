import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDriverStore } from './store/driverStore'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AvailableRidesPage from './pages/AvailableRidesPage'
import MyRidesPage from './pages/MyRidesPage'
import ActiveRidePage from './pages/ActiveRidePage'
import RideHistoryPage from './pages/RideHistoryPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const { isAuthenticated, initializeAuth } = useDriverStore()

  useEffect(() => {
    // Initialize authentication from localStorage on app start
    initializeAuth()
  }, [initializeAuth])

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/available" /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/available" /> : <SignupPage />}
        />
        <Route
          path="/available"
          element={
            <ProtectedRoute>
              <AvailableRidesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-rides"
          element={
            <ProtectedRoute>
              <MyRidesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ride/:rideId"
          element={
            <ProtectedRoute>
              <ActiveRidePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <RideHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/available" />} />
      </Routes>
    </Router>
  )
}

export default App