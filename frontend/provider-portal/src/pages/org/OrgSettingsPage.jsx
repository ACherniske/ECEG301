import { useParams, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { useEffect } from 'react'

export default function OrgSettingsPage() {
  const { orgId } = useParams()
  const location = useLocation()
  const { organizationId } = useAuthStore()

  // Log when page is accessed
  useEffect(() => {
    console.log('Settings page mounted/accessed')
    // Add any data fetching or reset logic here when implemented
  }, [orgId, location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        {/* Add account settings here */}
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600">Settings page - Coming soon</p>
        </div>
      </div>
    </div>
  )
}