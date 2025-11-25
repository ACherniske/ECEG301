import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'

export default function OrgProfilePage() {
  const { orgId } = useParams()
  const { organizationId } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
        {/* Add profile settings here */}
      </div>
    </div>
  )
}