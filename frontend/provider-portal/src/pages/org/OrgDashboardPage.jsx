import { useParams } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { user, organization } = useAuthStore()
  const { 
    rides, 
    upcomingCount, 
    completedToday, 
    pendingConfirmation, 
    isLoading, 
    fetchRides, 
    updateRideStatus, 
    updateRide,
    clearData 
  } = useRideStore()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch rides on mount
  useEffect(() => {
    fetchRides(orgId)
  }, [orgId, fetchRides])

  const handleStatusUpdate = async (rideId, newStatus) => {
    setError('')
    setSuccess('')

    try {
      await updateRideStatus(orgId, rideId, newStatus)
      setSuccess('Ride status updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update ride status')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError('')
    setSuccess('')

    try {
      // Clear cached data to force a fresh fetch
      clearData()
      await fetchRides(orgId)
      setSuccess('Rides refreshed successfully')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to refresh rides')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRideUpdate = async (rideId, updatedRide) => {
    setError('')
    setSuccess('')

    try {
      // You'll need to implement this in your store/API
      await updateRide(orgId, rideId, updatedRide)
      setSuccess('Ride updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update ride')
      setTimeout(() => setError(''), 3000)
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
            label="Pending Confirmation"
            value={pendingConfirmation}
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