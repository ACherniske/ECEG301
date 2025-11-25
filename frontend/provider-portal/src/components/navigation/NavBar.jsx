import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { UserProfileMenu } from './UserProfileMenu'
import { Settings } from 'lucide-react'

export const NavBar = () => {
  const navigate = useNavigate()
  const { orgId } = useParams()
  const { organization, user } = useAuthStore()

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/org/${orgId}/dashboard`)}>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <span className="text-blue-600 font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Provider Portal</h1>
            {organization && (
              <p className="text-xs text-blue-100">{organization.name}</p>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          <button 
            onClick={() => navigate(`/org/${orgId}/dashboard`)}
            className="hover:text-blue-100 transition-colors font-medium"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate(`/org/${orgId}/schedule-ride`)}
            className="hover:text-blue-100 transition-colors font-medium"
          >
            Schedule Ride
          </button>
          <button 
            onClick={() => navigate(`/org/${orgId}/ride-history`)}
            className="hover:text-blue-100 transition-colors font-medium"
          >
            Ride History
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate(`/org/${orgId}/admin`)}
              className="hover:text-blue-100 transition-colors font-medium flex items-center gap-2"
            >
              <Settings size={16} />
              Admin
            </button>
          )}
        </div>

        <UserProfileMenu orgId={orgId} />
      </div>
    </nav>
  )
}