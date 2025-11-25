import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'

export default function OrgSettingsPage() {
  const { orgId } = useParams()
  const { organizationId } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        {/* Add account settings here */}
      </div>
    </div>
  )
}