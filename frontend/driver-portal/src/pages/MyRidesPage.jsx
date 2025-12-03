import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDriverStore } from '../store/driverStore'
import { useRideStore } from '../store/rideStore'
import { rideService } from '../services/rideService'
import { BottomNav } from '../components/shared/BottomNav'
import { MyRideCard } from '../components/driver/MyRideCard'
import { RefreshCw, AlertCircle } from 'lucide-react'

export default function MyRidesPage() {
  const navigate = useNavigate()
  const { driver, organizationId } = useDriverStore()
  const { myRides, setMyRides, setActiveRide, loading, setLoading } = useRideStore()
  const [refreshing, setRefreshing] = useState(false)

  const fetchMyRides = async () => {
    setLoading(true)
    try {
      const rides = await rideService.getMyRides()
      setMyRides(rides)
    } catch (error) {
      console.error('Failed to fetch my rides:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyRides()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMyRides, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleStartRide = async (ride) => {
    try {
      // Update status to en route
      await rideService.startRide(ride.id)
      
      // Set as active ride with proper initialization and navigate
      setActiveRide({ 
        ...ride, 
        status: 'en route',
        currentStage: 0 // Initialize to first stage (Go to Pickup)
      })
      navigate(`/ride/${ride.id}`)
    } catch (error) {
      console.error('Failed to start ride:', error)
      alert('Failed to start ride. Please try again.')
    }
  }

  const handleViewDetails = (ride) => {
    setActiveRide(ride)
    navigate(`/ride/${ride.id}`)
  }

  const handleCancelRide = async (ride, reason) => {
    try {
      await rideService.cancelRide(ride.id, reason)
      alert('Ride cancelled successfully')
      // Refresh the list
      await fetchMyRides()
    } catch (error) {
      console.error('Failed to cancel ride:', error)
      alert('Failed to cancel ride. Please try again.')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMyRides()
    setRefreshing(false)
  }

  // Separate confirmed and in-progress rides
  const confirmedRides = myRides.filter(r => r.status === 'claimed')
  const inProgressRides = myRides.filter(r => ['en route', 'in transit', 'arrived'].includes(r.status))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">My Rides</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors active:scale-95"
          >
            <RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-blue-100">
          {myRides.length} active ride{myRides.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Rides List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your rides...</p>
          </div>
        ) : myRides.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-semibold mb-2">No active rides</p>
            <p className="text-gray-500 text-sm mb-4">Accept a ride from the Available tab</p>
            <button
              onClick={() => navigate('/available')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              View Available Rides
            </button>
          </div>
        ) : (
          <>
            {/* In Progress Rides */}
            {inProgressRides.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  In Progress
                </h2>
                {inProgressRides.map((ride) => (
                  <MyRideCard
                    key={ride.id}
                    ride={ride}
                    onStartRide={handleStartRide}
                    onViewDetails={handleViewDetails}
                    onCancel={handleCancelRide}
                  />
                ))}
              </div>
            )}

            {/* Confirmed/Upcoming Rides */}
            {confirmedRides.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Upcoming
                </h2>
                {confirmedRides.map((ride) => (
                  <MyRideCard
                    key={ride.id}
                    ride={ride}
                    onStartRide={handleStartRide}
                    onViewDetails={handleViewDetails}
                    onCancel={handleCancelRide}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}