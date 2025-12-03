import { useEffect } from 'react'
import { useDriverStore } from '../store/driverStore'
import { useRideStore } from '../store/rideStore'
import { rideService } from '../services/rideService'
import { BottomNav } from '../components/shared/BottomNav'
import { RefreshCw } from 'lucide-react'

export default function AvailableRidesPage() {
  const { organizationId } = useDriverStore()
  const { availableRides, setAvailableRides, loading, setLoading } = useRideStore()

  const fetchAvailableRides = async () => {
    setLoading(true)
    try {
      const rides = await rideService.getAvailableRides(organizationId)
      setAvailableRides(rides)
    } catch (error) {
      console.error('Failed to fetch rides:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableRides()
  }, [organizationId])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Available Rides</h1>
          <button
            onClick={fetchAvailableRides}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw size={24} />
          </button>
        </div>
        <p className="text-blue-100">
          {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} waiting
        </p>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading rides...</p>
          </div>
        ) : availableRides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No rides available</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon</p>
          </div>
        ) : (
          availableRides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">{ride.patientName}</h3>
              <p className="text-sm text-gray-500 mb-2">ID: {ride.patientId}</p>
              <p className="text-sm text-gray-600">📍 {ride.appointmentLocation}</p>
              <p className="text-sm text-gray-600">📅 {ride.appointmentDate} at {ride.appointmentTime}</p>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}