import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export const OrgProtectedRoute = ({ children, requiredOrgId }) => {
  const { isAuthenticated, organizationId } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!organizationId) {
    return <Navigate to="/login" />
  }

  // Check if user is trying to access a different organization
  if (requiredOrgId && organizationId !== requiredOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this organization.</p>
          <button
            onClick={() => window.location.href = `/org/${organizationId}/dashboard`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Your Organization
          </button>
        </div>
      </div>
    )
  }

  return children
}