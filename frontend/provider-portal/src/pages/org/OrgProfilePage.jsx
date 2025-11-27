import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { Button } from '../../components/shared/Button'
import { SectionTitle } from '../../components/shared/SectionTitle'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react'

export default function OrgProfilePage() {
  const { orgId } = useParams()
  const location = useLocation()
  const { organizationId, user, organization, updateUser } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    role: 'provider',
    department: '',
    title: '',
    bio: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'en',
    timezone: 'America/New_York'
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
            <p className="text-red-600">You don't have permission to view this profile.</p>
          </div>
        </div>
      </div>
    )
  }

  // Load user data when page is accessed
  useEffect(() => {
    console.log('Profile page mounted/accessed')
    if (orgId && user) {
      setError('')
      setSuccess('')
      loadUserData()
    }
  }, [orgId, location.pathname, user])

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Load user data from auth store
      if (user) {
        setProfileData(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          role: user.role || 'provider',
          department: user.department || '',
          title: user.title || '',
          bio: user.bio || ''
        }))
      }

      console.log('User profile loaded')
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!profileData.firstName || !profileData.lastName || !profileData.email) {
        throw new Error('First name, last name, and email are required')
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileData.email)) {
        throw new Error('Please enter a valid email address')
      }

      console.log('Saving profile data:', profileData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update auth store
      updateUser({
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        department: profileData.department,
        title: profileData.title,
        bio: profileData.bio
      })

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    setSaving(true)
    setError('')

    try {
      console.log('Changing password...')

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordFields(false)
      setSuccess('Password changed successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      console.error('Error changing password:', err)
      setError('Failed to change password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'dev': return 'bg-blue-100 text-blue-700'
      case 'provider': return 'bg-green-100 text-green-700'
      case 'staff': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
          <Button
            variant="outline"
            onClick={loadUserData}
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

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-4">
              <User className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user?.role)}`}>
                  <Shield size={14} className="inline mr-1" />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                <div className="flex items-center text-gray-600">
                  <Building2 size={16} className="mr-1" />
                  <span className="text-sm">{organization?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="text-blue-600" size={24} />
            <SectionTitle>Personal Information</SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => handleProfileChange('firstName', e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => handleProfileChange('lastName', e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                placeholder="john.doe@organization.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={profileData.department}
                onChange={(e) => handleProfileChange('department', e.target.value)}
                placeholder="Cardiology"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={profileData.title}
                onChange={(e) => handleProfileChange('title', e.target.value)}
                placeholder="Registered Nurse"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={profileData.address}
              onChange={(e) => handleProfileChange('address', e.target.value)}
              placeholder="123 Healthcare Dr, Medical City, State 12345"
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              placeholder="Brief description about yourself..."
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={saving || loading}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-blue-600" size={24} />
            <SectionTitle>Security Settings</SectionTitle>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-600">Last changed: Never</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center gap-2"
            >
              {showPasswordFields ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPasswordFields ? 'Cancel' : 'Change Password'}
            </Button>
          </div>

          {showPasswordFields && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleChangePassword}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="text-blue-600" size={24} />
            <SectionTitle>Notification Preferences</SectionTitle>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-600">Receive updates via text message</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.smsNotifications}
                onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Dark Mode</h4>
                <p className="text-sm text-gray-600">Use dark theme (Coming soon)</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.darkMode}
                onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}