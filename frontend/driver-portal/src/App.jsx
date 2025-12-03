import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDriverStore } from './store/driverStore'
import LoginPage from './pages/LoginPage'
import AvailableRidesPage from './pages/AvailableRidesPage'
import MyRidesPage from './pages/MyRidesPage'
import RideHistoryPage from './pages/RideHistoryPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useDriverStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  const { login, isAuthenticated } = useDriverStore()

  useEffect(() => {
    const token = localStorage.getItem('driverToken')
    const driverData = localStorage.getItem('driver')
    
    if (token && driverData) {
      const driver = JSON.parse(driverData)
      login(driver, 'org-downtown-medical')
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/available" /> : <LoginPage />}
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