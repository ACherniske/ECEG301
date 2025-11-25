import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export const GoogleAuthButton = () => {
  const { login } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="w-full">
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
    </div>
  )
}