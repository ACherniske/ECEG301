import { useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Plus, Calendar, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { StatCard } from '../../components/shared/StatCard'
import { Button } from '../../components/shared/Button'
import { SectionTitle } from '../../components/shared/SectionTitle'
import { RideListItem } from '../../components/dashboard/RideListItem'
import { NotificationOverlay } from '../../components/shared/NotificationOverlay'
import { useRideStore } from '../../store/rideStore'


export default function OrgDashboardPage() {
  const { orgId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, organization } = useAuthStore()
  const { 
    rides, 
    upcomingCount, 
    completedToday, 
    awaitingDriver, 
    isLoading, 
    fetchRides, 
    updateRideStatus, 
    updateRide,
    clearData 
  } = useRideStore()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh when page is accessed (including navigation between pages)
  useEffect(() => {
    if (orgId) {
      // Clear any existing error/success messages when switching to this page
      setError('')
      setSuccess('')
      
      // Force refresh rides data
      clearData()
      fetchRides(orgId)
    }
  }, [orgId, location.pathname, fetchRides, clearData])

  // Check for success messages from navigation state (like from ride scheduling)
  useEffect(() => {
    if (location.state?.message) {
      if (location.state.type === 'success') {
        setSuccess(location.state.message)
        setTimeout(() => setSuccess(''), 5000)
      } else if (location.state.type === 'error') {
        setError(location.state.message)
        setTimeout(() => setError(''), 5000)
      }
      
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  const handleRideUpdate = async (rideId, updateFields) => {
    try {
      const { rowIndex, ...fieldsToUpdate } = updateFields
      await updateRide(orgId, rideId, fieldsToUpdate)
      setSuccess('Ride updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to update ride:', error)
      setError('Failed to update ride')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleStatusUpdate = async (rideId, newStatus) => {
    try {
      await updateRideStatus(orgId, rideId, newStatus)
      setSuccess('Ride status updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to update ride status:', error)
      setError('Failed to update ride status')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError('')
    setSuccess('')

    try {
      clearData()
      await fetchRides(orgId)
      setSuccess('Dashboard refreshed successfully')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to refresh dashboard')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      {/* Notification Overlay */}
      <NotificationOverlay error={error} success={success} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Organization Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{organization?.name}</h2>
          <p className="text-gray-600">Role: {user?.role || 'Member'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Upcoming Rides"
            value={upcomingCount}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
            borderColor="border-blue-300"
            icon={Calendar}
          />
          <StatCard
            label="Completed Today"
            value={completedToday}
            bgColor="bg-green-100"
            textColor="text-green-600"
            borderColor="border-green-300"
            icon={CheckCircle2}
          />
          <StatCard
            label="Unclaimed Rides"
            value={awaitingDriver}
            bgColor="bg-amber-100"
            textColor="text-amber-600"
            borderColor="border-amber-300"
            icon={Clock}
          />
        </div>

        {/* Today's Rides Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>Today's Scheduled Rides</SectionTitle>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="p-3 aspect-square flex items-center justify-center bg-gray-100 hover:bg-gray-200 border-gray-200"
              >
                <RefreshCw 
                  className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate(`/org/${orgId}/schedule-ride`)}
              >
                Schedule New Ride
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading && !isRefreshing ? (
              <div className="text-center py-8 text-gray-500">
                Loading rides...
              </div>
            ) : rides.length > 0 ? (
              rides.map((ride) => (
                <RideListItem 
                  key={ride.id} 
                  ride={ride}
                  onStatusUpdate={handleStatusUpdate}
                  onRideUpdate={handleRideUpdate} // Add this new function
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No scheduled rides for today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}