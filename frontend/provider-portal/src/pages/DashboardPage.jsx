import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { NavBar } from '../components/navigation/NavBar'
import { StatCard } from '../components/shared/StatCard'
import { Button } from '../components/shared/Button'
import { SectionTitle } from '../components/shared/SectionTitle'
import { RideListItem } from '../components/dashboard/RideListItem'
import { useRideStore } from '../store/rideStore'

export default function DashboardPage({ onLogout }) {
  const navigate = useNavigate()
  const { rides, upcomingCount, completedToday, pendingConfirmation, isLoading, error, fetchRides } = useRideStore()

  // Fetch rides when component mounts
  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-6">
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
            textColor="text-green-700"
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
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>Today's Scheduled Rides</SectionTitle>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => navigate('/schedule-ride')}
            >
              Schedule New Ride
            </Button>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              Loading rides...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              Error loading rides: {error}
            </div>
          )}

          {/* Rides List */}
          {!isLoading && !error && (
            <div className="space-y-3">
              {rides.length > 0 ? (
                rides.map((ride) => (
                  <RideListItem key={ride.id} ride={ride} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No scheduled rides for today
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}