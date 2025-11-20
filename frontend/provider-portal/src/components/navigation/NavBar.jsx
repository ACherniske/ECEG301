import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/Button'

export const NavBar = ({ onLogout }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    onLogout()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">P</span>
          </div>
          <h1 className="text-2xl font-bold">Provider Portal</h1>
        </div>

        <div className="flex gap-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="hover:text-blue-100 transition-colors font-medium"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/schedule-ride')}
            className="hover:text-blue-100 transition-colors font-medium"
          >
            Schedule Ride
          </button>
          <button 
            onClick={() => navigate('/ride-history')}
            className="hover:text-blue-100 transition-colors font-medium"
          >
            Ride History
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={LogOut}
          onClick={handleLogout}
          className="bg-blue-700 text-white hover:bg-blue-800"
        >
          Logout
        </Button>
      </div>
    </nav>
  )
}