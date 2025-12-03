import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useDriverStore } from '../store/driverStore'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, validateAuth, initializeAuth } = useDriverStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Initialize auth from localStorage
        initializeAuth()
        
        // Validate current authentication
        const valid = await validateAuth()
        setIsValid(valid)
      } catch (error) {
        console.error('Auth validation error:', error)
        setIsValid(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [validateAuth, initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Verifying authentication...</span>
        </div>
      </div>
    )
  }

  if (!isValid || !isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
