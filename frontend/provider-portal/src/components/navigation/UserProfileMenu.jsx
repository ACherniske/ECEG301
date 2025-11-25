import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, User, Building2, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'

export const UserProfileMenu = ({ orgId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const { user, organization, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    authService.logout()
    logout()
    navigate('/login')
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const initials = getInitials(user?.firstName, user?.lastName)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
          {initials}
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="bg-linear-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Organization Info */}
          {organization && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-start gap-2">
                <Building2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{organization?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{organization?.role || 'Member'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                navigate(`/org/${orgId}/profile`)
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <User size={16} className="text-gray-400" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => {
                navigate(`/org/${orgId}/settings`)
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <Settings size={16} className="text-gray-400" />
              <span>Account Settings</span>
            </button>

            <hr className="my-2" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}