import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { Button } from '../../components/shared/Button'
import { SectionTitle } from '../../components/shared/SectionTitle'
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  RefreshCw, 
  Shield,
  Settings,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export default function OrgSettingsPage() {
  const { orgId } = useParams()
  const location = useLocation()
  const { organizationId, organization, user, updateOrganization } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    timezone: 'America/New_York',
    businessHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '12:00', closed: true },
      sunday: { open: '09:00', close: '12:00', closed: true }
    }
  })

  // Security check
  if (organizationId !== orgId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-2" size={24} />
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">You don't have permission to view these settings.</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has admin role
  const isAdmin = user?.role === 'admin' || user?.role === 'dev'

  // Load organization data when page is accessed
  useEffect(() => {
    if (orgId) {
      setError('')
      setSuccess('')
      loadOrganizationData()
    }
  }, [orgId, location.pathname])

  const loadOrganizationData = async () => {
    setLoading(true)
    try {
      // Use existing organization data from auth store if available
      if (organization) {
        setOrgData(prev => ({
          ...prev,
          name: organization.name || '',
          address: organization.address || '',
          phone: organization.phone || '',
          email: organization.email || ''
        }))
      }

      // In a real app, you'd fetch additional settings from the API
      // For now, we'll use mock data
    } catch (err) {
      console.error('Error loading organization data:', err)
      setError('Failed to load organization settings')
    } finally {
      setLoading(false)
    }
  }

  const handleOrgDataChange = (field, value) => {
    setOrgData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBusinessHoursChange = (day, field, value) => {
    setOrgData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }))
  }

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!isAdmin) {
      setError('You must be an administrator to save settings')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // In a real app, you'd save to the backend

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update auth store if organization data changed
      if (orgData.name !== organization?.name || orgData.address !== organization?.address) {
        updateOrganization({
          ...organization,
          name: orgData.name,
          address: orgData.address,
          phone: orgData.phone,
          email: orgData.email
        })
      }

      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Settings</h1>
            <p className="text-gray-600">Manage your organization profile and preferences</p>
          </div>
          <Button
            variant="outline"
            onClick={loadOrganizationData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle2 className="text-green-500 mr-2" size={20} />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Organization Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="text-blue-600" size={24} />
            <SectionTitle>Organization Information</SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => handleOrgDataChange('name', e.target.value)}
                placeholder="Healthcare Organization"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={orgData.email}
                onChange={(e) => handleOrgDataChange('email', e.target.value)}
                placeholder="contact@organization.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={orgData.phone}
                onChange={(e) => handleOrgDataChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={orgData.timezone}
                onChange={(e) => handleOrgDataChange('timezone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={orgData.address}
              onChange={(e) => handleOrgDataChange('address', e.target.value)}
              placeholder="123 Medical Center Dr, Healthcare City, State 12345"
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isAdmin}
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={orgData.description}
              onChange={(e) => handleOrgDataChange('description', e.target.value)}
              placeholder="Brief description of your organization..."
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isAdmin}
            />
          </div>
        </div>

        {/* Transportation Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-blue-600" size={24} />
            <SectionTitle>Transportation Preferences</SectionTitle>
          </div>

          <div className="text-center py-8">
            <Settings className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500 text-lg">Coming Soon</p>
            <p className="text-gray-400 text-sm mt-2">
              Advanced transportation settings and preferences will be available in a future update.
            </p>
          </div>
        </div>

        {/* Access Control */}
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Shield className="text-amber-500 mr-2" size={20} />
              <p className="text-amber-700">
                You are viewing settings in read-only mode. Administrator access is required to make changes.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}