import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Car, MapPin, LogOut, Edit } from 'lucide-react'
import { BottomNav } from '../components/shared/BottomNav'
import { Button } from '../components/shared/button'
import { useDriverStore } from '../store/driverStore'
import { driverService } from '../services/driverService'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  
  const navigate = useNavigate()
  const { driver, logout, updateDriver } = useDriverStore()

  useEffect(() => {
    fetchProfileAndStatistics()
  }, [])

  const fetchProfileAndStatistics = async () => {
    try {
      setLoading(true)
      
      // Fetch profile and statistics in parallel
      const [profileData, statisticsData] = await Promise.all([
        driverService.getProfile(),
        driverService.getStatistics()
      ])
      
      setProfile(profileData)
      setStatistics(statisticsData)
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        address: profileData.address || '',
        driverMake: profileData.driverMake || '',
        driverModel: profileData.driverModel || '',
        licensePlate: profileData.licensePlate || ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const profileData = await driverService.getProfile()
      setProfile(profileData)
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        address: profileData.address || '',
        driverMake: profileData.driverMake || '',
        driverModel: profileData.driverModel || '',
        licensePlate: profileData.licensePlate || ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      const updatedProfile = await driverService.updateProfile(editForm)
      setProfile(updatedProfile)
      updateDriver(updatedProfile)
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      setError('Failed to sign out')
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase()
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header Section */}
        <div className="bg-blue-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-blue-100 mt-1">Loading driver information...</p>
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-blue-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-blue-100 mt-1">Driver: {profile?.userId || 'N/A'}</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-3 bg-blue-500 hover:bg-blue-400 rounded-full transition-colors"
          >
            <Edit size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Personal Information Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">
                {getInitials(profile?.firstName, profile?.lastName)}
              </span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className="text-gray-500">Driver ID: {profile?.userId}</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="text-gray-400" size={20} />
              <span className="text-gray-700">{profile?.email}</span>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="text-gray-400" size={20} />
              {isEditing ? (
                <input
                  type="text"
                  placeholder="Address"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <span className="text-gray-700">{profile?.address || 'No address provided'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Information Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Car className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Make & Model:</span>
              {isEditing ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Make"
                    value={editForm.driverMake}
                    onChange={(e) => setEditForm(prev => ({ ...prev, driverMake: e.target.value }))}
                    className="px-3 py-1 border border-gray-300 rounded-lg w-24"
                  />
                  <input
                    type="text"
                    placeholder="Model"
                    value={editForm.driverModel}
                    onChange={(e) => setEditForm(prev => ({ ...prev, driverModel: e.target.value }))}
                    className="px-3 py-1 border border-gray-300 rounded-lg w-24"
                  />
                </div>
              ) : (
                <span className="font-medium text-gray-900">
                  {profile?.driverMake && profile?.driverModel 
                    ? `${profile.driverMake} ${profile.driverModel}` 
                    : 'Not specified'}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">License Plate:</span>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="ABC-1234"
                  value={editForm.licensePlate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg w-32"
                />
              ) : (
                <span className="font-medium text-gray-900">
                  {profile?.licensePlate || 'Not specified'}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status:</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {profile?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {statistics?.totalRides ?? '--'}
              </div>
              <div className="text-sm text-gray-500">Total Rides</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {statistics?.completionRate !== undefined ? `${statistics.completionRate}%` : '--%'}
              </div>
              <div className="text-sm text-gray-500">Completion</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">
                {statistics?.totalDistanceTraveled !== undefined ? `${statistics.totalDistanceTraveled} mi` : '-- mi'}
              </div>
              <div className="text-sm text-gray-500">Total Distance</div>
            </div>
          </div>
          {statistics && statistics.totalRides > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600 text-center">
                {statistics.completedRides} of {statistics.totalRides} rides completed
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isEditing && (
            <div className="flex space-x-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          
          <Button
            variant="danger"
            fullWidth
            onClick={handleSignOut}
            icon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}