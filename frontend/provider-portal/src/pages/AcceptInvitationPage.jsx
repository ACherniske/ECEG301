import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Mail, User, ArrowRight, AlertTriangle, CheckCircle, Timer } from 'lucide-react'
import { Button } from '../components/shared/Button'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  
  const token = searchParams.get('token')
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdAccount, setCreatedAccount] = useState(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('No invitation token provided')
        setLoading(false)
        return
      }

      try {
        console.log('Loading invitation with token:', token)
        const response = await api.get(`/accept-invitation/${token}`)
        const data = response.data
        
        console.log('Invitation data:', data)
        setInvitation(data)
      } catch (err) {
        console.error('Error loading invitation:', err)
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load invitation'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadInvitation()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)

    try {
      console.log('Accepting invitation...')
      const response = await api.post(`/accept-invitation/${token}`, {
        password: formData.password,
      })

      const { user, organization, token: authToken, success } = response.data
      
      if (!success || !authToken) {
        throw new Error('Invalid response from server')
      }

      console.log('Account created successfully:', { user, organization })
      
      // Store the created account data for the success screen
      setCreatedAccount({ user, organization, token: authToken })
      
      // Show success screen
      setShowSuccess(true)
      
      // Login with the new account
      login(user, authToken, organization, 'local')
      
      // Start countdown and redirect after 3 seconds
      let timeLeft = 3
      setCountdown(timeLeft)
      
      const countdownInterval = setInterval(() => {
        timeLeft -= 1
        setCountdown(timeLeft)
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval)
          navigate(`/org/${organization.id}/dashboard`)
        }
      }, 1000)
    } catch (err) {
      console.error('Error accepting invitation:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create account'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    const isExpired = error.toLowerCase().includes('expired')
    const isInvalid = error.toLowerCase().includes('invalid') || error.toLowerCase().includes('not found')
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            isExpired ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {isExpired ? (
              <AlertTriangle className="text-yellow-600" size={32} />
            ) : (
              <span className="text-red-600 text-2xl">!</span>
            )}
          </div>
          <h1 className={`text-2xl font-bold mb-4 ${
            isExpired ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {isExpired ? 'Invitation Expired' : 'Invalid Invitation'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          {isExpired && (
            <p className="text-sm text-gray-500 mb-6">
              Please contact your administrator to request a new invitation.
            </p>
          )}
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  // Success confirmation screen
  if (showSuccess && createdAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 via-white to-green-50 p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-bounce">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            
            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Team!</h1>
            <p className="text-gray-600 font-medium mb-6">Your account has been created successfully</p>
            
            {/* Account Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Account Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-800">
                    {createdAccount.user.firstName} {createdAccount.user.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-800">{createdAccount.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-gray-800 capitalize">{createdAccount.user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium text-gray-800">{createdAccount.organization.name}</span>
                </div>
              </div>
            </div>

            {/* Auto-redirect message */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <Timer size={16} />
              <span>Redirecting to your dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
            </div>

            {/* Manual navigation button */}
            <Button
              onClick={() => navigate(`/org/${createdAccount.organization.id}/dashboard`)}
              variant="primary"
              className="w-full"
              icon={ArrowRight}
            >
              Continue to Dashboard
            </Button>

            {/* Security notice */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p>Your account is secure and HIPAA compliant</p>
                <p>You are now logged in and ready to start</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600 font-medium">Set up your account</p>
          </div>

          {invitation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-1">Invited as:</p>
              <p className="font-semibold text-gray-900">{invitation.firstName} {invitation.lastName}</p>
              <p className="text-sm text-gray-600">{invitation.email}</p>
              <p className="text-sm text-gray-600">Role: {invitation.role}</p>
              <p className="text-sm text-gray-600 mt-2">Organization: {invitation.organizationName}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Create Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={submitting}
              icon={ArrowRight}
            >
              {submitting ? 'Creating account...' : 'Create Account & Sign In'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Protected Health Information (PHI)</p>
              <p>HIPAA Compliant | End-to-End Encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}