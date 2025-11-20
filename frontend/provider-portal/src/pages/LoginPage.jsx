import { Button } from '../components/shared/Button'

export default function LoginPage({ onLogin }) {
  const handleDemoLogin = () => {
    onLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Provider Portal</h1>
            <p className="text-gray-600">Healthcare Transportation System</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="provider@hospital.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleDemoLogin}
              className="w-full"
            >
              Sign In
            </Button>

            <div className="text-center text-sm text-gray-600 mt-6">
              Demo: Click sign in to access the dashboard
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Protected Health Information (PHI)</p>
              <p>HIPAA Compliant System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}