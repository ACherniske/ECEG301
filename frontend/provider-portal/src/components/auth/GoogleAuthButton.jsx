import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export const GoogleAuthButton = () => {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    // Don't load Google Auth if no client ID is configured
    if (!clientId) {
      console.warn('Google Client ID not configured. Google Sign-In disabled.')
      return
    }

    // Load Google Sign-In script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => setIsGoogleReady(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [clientId])

  // Don't render if no client ID
  if (!clientId) {
    return null
  }

  return (
    <div className="w-full">
      {isGoogleReady ? (
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            authService.loginGoogle(credentialResponse.credential)
              .then(({ user, token, organization }) => {
                login(user, token, organization, 'google')
                navigate('/dashboard')
              })
              .catch(err => {
                console.error('Google login failed:', err)
              })
          }}
          onError={() => {
            console.error('Google login failed')
          }}
          text="signin_with"
          size="large"
          width="100%"
        />
      ) : (
        <div className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-center text-gray-500">
          Loading Google Sign-In...
        </div>
      )}
    </div>
  )
}