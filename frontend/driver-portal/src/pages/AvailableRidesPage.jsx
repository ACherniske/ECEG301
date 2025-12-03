import { useEffect, useState } from 'react'
import { useDriverStore } from '../store/driverStore'
import { useRideStore } from '../store/rideStore'
import { rideService } from '../services/rideService'
import { BottomNav } from '../components/shared/BottomNav'
import { EnhancedRideCard } from '../components/driver/RideCard'
import { RefreshCw, TrendingUp, Star, PartyPopper } from 'lucide-react'

export default function AvailableRidesPage() {
  const { organizationId } = useDriverStore()
  const { availableRides, setAvailableRides, loading, setLoading } = useRideStore()
  const [acceptanceSummary, setAcceptanceSummary] = useState(null)

  const fetchAvailableRides = async () => {
    setLoading(true)
    try {
      const data = await rideService.getAvailableRides()
      
      // Check if data has the new acceptance scoring format
      if (data.rides && Array.isArray(data.rides)) {
        setAvailableRides(data.rides)
        setAcceptanceSummary(data.summary || null)
      } else {
        // Fallback for old format
        setAvailableRides(Array.isArray(data) ? data : [])
        setAcceptanceSummary(null)
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error)
      setAvailableRides([])
      setAcceptanceSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRide = async (ride) => {
    try {
      const result = await rideService.acceptRide(ride.id)
      
      // Show success message with calculated pickup time
      const pickupTime = result.pickupTime || 'TBD'
      alert(`Ride accepted successfully!\n\nCalculated pickup time: ${pickupTime}\n\nThis time is based on:\n- Appointment time: ${ride.appointmentTime}\n- Travel time to appointment\n- 15-minute buffer for preparation`)
      
      // Refresh the list after accepting a ride
      await fetchAvailableRides()
    } catch (error) {
      console.error('Failed to accept ride:', error)
      alert('Failed to accept ride. Please try again.')
    }
  }

  const handleViewRideDetails = (ride) => {
    // TODO: Navigate to ride details page or open modal
    console.log('View ride details:', ride)
  }

  useEffect(() => {
    fetchAvailableRides()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Available Rides</h1>
          <button
            onClick={fetchAvailableRides}
            disabled={loading}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="text-blue-100">
            {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} available
          </p>
          {acceptanceSummary && (
            <div className="flex items-center gap-2 text-blue-100">
              <Star size={16} />
              <span className="text-sm">
                Avg Score: {acceptanceSummary.averageScore?.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
        
        {acceptanceSummary && acceptanceSummary.eligibleCount !== acceptanceSummary.totalCount && (
          <div className="mt-2 text-blue-200 text-sm">
            <TrendingUp size={14} className="inline mr-1" />
            {acceptanceSummary.eligibleCount} eligible • {acceptanceSummary.ineligibleCount} filtered out
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Finding your best matches...</p>
          </div>
        ) : availableRides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No rides available</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon for new opportunities</p>
          </div>
        ) : (
          availableRides.map((ride) => (
            <EnhancedRideCard
              key={ride.id}
              ride={ride}
              onAccept={handleAcceptRide}
              onView={handleViewRideDetails}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}