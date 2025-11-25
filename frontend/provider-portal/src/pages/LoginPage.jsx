import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { Button } from '../components/shared/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { token, user, organization } = await authService.loginLocal(email, password)
      login(user, token, organization, 'local')
      navigate(`/org/${organization.id}/dashboard`)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  //hard coded login for testing
  const handleAdminLogin = () => {
    const adminUser = {
      id: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    }
    const adminToken = 'admin-token'
    const adminOrganization = {
      id: 'org1',
      name: 'Admin Organization',
    }
    login(adminUser, adminToken, adminOrganization, 'local')
    navigate(`/org/${adminOrganization.id}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Portal</h1>
            <p className="text-gray-600 font-medium">Healthcare Transportation Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="provider@hospital.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded w-4 h-4 cursor-pointer" />
                <span className="text-gray-700">Remember me</span>
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={loading}
              icon={ArrowRight}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">or</span>
            </div>
          </div>

          {/* OAuth Button */}
          <GoogleAuthButton />

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={handleAdminLogin}
            >
              Admin Test Login (Development Only)
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Protected Health Information (PHI)</p>
              <p>HIPAA Compliant | End-to-End Encrypted</p>
              <p className="text-xs text-gray-400 mt-3">Need access? Contact your organization administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}