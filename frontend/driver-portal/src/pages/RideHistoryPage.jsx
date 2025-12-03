import { useState, useEffect } from 'react'
import { ChevronLeft, MapPin, Calendar, Clock, CheckCircle, RotateCcw, AlertCircle, Search, Filter, ChevronDown, RefreshCw } from 'lucide-react'
import { BottomNav } from '../components/shared/BottomNav'
import { Card } from '../components/shared/Card'
import { rideService } from '../services/rideService'

const HistoryRideCard = ({ ride }) => {
  // Comprehensive round trip detection
  const roundTripValue = ride.roundTrip
  const isRoundTrip = !!(
    roundTripValue === 'Yes' || 
    roundTripValue === 'yes' ||
    roundTripValue === 'YES' ||
    roundTripValue === 'Y' ||
    roundTripValue === 'y' ||
    roundTripValue === 'True' ||
    roundTripValue === 'true' ||
    roundTripValue === 'TRUE' ||
    roundTripValue === true ||
    roundTripValue === 1 ||
    roundTripValue === '1'
  )

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{ride.patientName}</h3>
          <p className="text-sm text-gray-500">ID: {ride.patientId}</p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          {isRoundTrip && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
              <RotateCcw size={12} />
              Round Trip
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle size={12} />
            Completed
          </span>
        </div>
      </div>

      {/* Ride Date */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
        <Calendar size={16} />
        <span>{formatDate(ride.appointmentDate)}</span>
      </div>

      {/* Route Information */}
      <div className="space-y-3 mb-4">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Pickup</p>
            <p className="text-sm text-gray-900 leading-snug">{ride.pickupLocation || ride.patientAddress}</p>
            {ride.pickupTime && (
              <p className="text-xs text-blue-600 font-bold mt-1">
                🕐 {ride.pickupTime}
              </p>
            )}
          </div>
        </div>

        {/* Connecting line */}
        <div className="ml-4 border-l-2 border-dashed border-gray-300 h-6"></div>

        {/* Destination */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Destination</p>
            <p className="text-sm text-gray-900 leading-snug">{ride.providerLocation || ride.appointmentLocation || ride.location}</p>
            <p className="text-xs text-gray-600 mt-1">
              📅 {ride.appointmentDate} at {ride.appointmentTime}
            </p>
          </div>
        </div>
      </div>

      {/* Distance and Notes Section */}
      <div className="space-y-3 mb-4">
        {/* Distance Traveled */}
        {ride.distanceTraveled && ride.distanceTraveled !== '0 mi' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">📏</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-700 mb-0.5">Distance Traveled</p>
                <p className="text-sm font-bold text-green-900">{ride.distanceTraveled}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {ride.notes && ride.notes.trim() !== '' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-700 mb-1">Notes</p>
                <p className="text-sm text-blue-900">{ride.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function RideHistoryPage() {
  const [rides, setRides] = useState([])
  const [filteredRides, setFilteredRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc') // date-desc, date-asc, patient-name, distance-desc
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState('all') // all, this-week, this-month, this-year

  useEffect(() => {
    fetchRideHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [rides, searchTerm, sortBy, dateRange])

  const fetchRideHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const historyData = await rideService.getRideHistory()
      setRides(historyData)
    } catch (err) {
      setError(err.message || 'Failed to load ride history')
    } finally {
      setLoading(false)
    }
  }

  const fetchRideHistoryRefresh = async () => {
    try {
      setError('')
      const historyData = await rideService.getRideHistory()
      setRides(historyData)
    } catch (err) {
      setError(err.message || 'Failed to load ride history')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRideHistoryRefresh()
    setRefreshing(false)
  }

  const applyFilters = () => {
    let filtered = [...rides]

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(ride => 
        ride.patientName.toLowerCase().includes(search) ||
        ride.patientId.toLowerCase().includes(search) ||
        (ride.pickupLocation && ride.pickupLocation.toLowerCase().includes(search)) ||
        (ride.providerLocation && ride.providerLocation.toLowerCase().includes(search))
      )
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()

      switch (dateRange) {
        case 'this-week':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case 'this-month':
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case 'this-year':
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter(ride => {
        try {
          const rideDate = new Date(ride.appointmentDate)
          return rideDate >= cutoffDate
        } catch {
          return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.appointmentDate) - new Date(a.appointmentDate)
        case 'date-asc':
          return new Date(a.appointmentDate) - new Date(b.appointmentDate)
        case 'patient-name':
          return a.patientName.localeCompare(b.patientName)
        case 'distance-desc':
          // Parse distance values (e.g., "15.2 mi" or "15.2" -> 15.2) and sort
          const getDistanceValue = (distanceStr) => {
            if (!distanceStr || distanceStr === '0 mi' || distanceStr === '0') return 0
            // Handle both formats: "15.2 mi" and "15.2"
            const match = distanceStr.match(/^([\d.]+)(?:\s*mi)?$/)
            return match ? parseFloat(match[1]) : 0
          }
          return getDistanceValue(b.distanceTraveled) - getDistanceValue(a.distanceTraveled)
        default:
          return 0
      }
    })

    setFilteredRides(filtered)
  }

  const getStatsData = () => {
    const totalRides = rides.length
    const thisMonth = rides.filter(ride => {
      try {
        const rideDate = new Date(ride.appointmentDate)
        const now = new Date()
        return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear()
      } catch {
        return false
      }
    }).length

    const roundTripRides = rides.filter(ride => {
      const roundTripValue = ride.roundTrip
      return !!(
        roundTripValue === 'Yes' || 
        roundTripValue === 'yes' ||
        roundTripValue === 'YES' ||
        roundTripValue === 'Y' ||
        roundTripValue === 'y' ||
        roundTripValue === 'True' ||
        roundTripValue === 'true' ||
        roundTripValue === 'TRUE' ||
        roundTripValue === true ||
        roundTripValue === 1 ||
        roundTripValue === '1'
      )
    }).length

    // Calculate total distance driven
    const totalDistance = rides.reduce((total, ride) => {
      if (!ride.distanceTraveled || ride.distanceTraveled === '0 mi' || ride.distanceTraveled === '0') return total
      // Handle both formats: "17.3 mi" and "17.3"
      const match = ride.distanceTraveled.match(/^([\d.]+)(?:\s*mi)?$/)
      const distance = match ? parseFloat(match[1]) : 0
      return total + distance
    }, 0)

    return { totalRides, thisMonth, roundTripRides, totalDistance }
  }

  const stats = getStatsData()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
          <h1 className="text-2xl font-bold">Ride History</h1>
        </div>
        <div className="p-4 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ride history...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Ride History</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors active:scale-95"
          >
            <RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-blue-100">Your completed rides</p>
      </div>

      <div className="p-4 pt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRides}</div>
            <div className="text-xs text-gray-500">Total Rides</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{stats.thisMonth}</div>
            <div className="text-xs text-gray-500">This Month</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.roundTripRides}</div>
            <div className="text-xs text-gray-500">Round Trips</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalDistance.toFixed(1)} mi</div>
            <div className="text-xs text-gray-500">Total Miles</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
            <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date-desc">Date (Newest first)</option>
                  <option value="date-asc">Date (Oldest first)</option>
                  <option value="patient-name">Patient Name (A-Z)</option>
                  <option value="distance-desc">Distance (Longest first)</option>
                </select>
              </div>

              {/* Date Range Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="this-week">Past 7 Days</option>
                  <option value="this-month">Past Month</option>
                  <option value="this-year">Past Year</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Error loading ride history</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Summary */}
        {!error && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredRides.length === rides.length 
                ? `${rides.length} completed ride${rides.length !== 1 ? 's' : ''}`
                : `${filteredRides.length} of ${rides.length} rides shown`
              }
            </p>
          </div>
        )}

        {/* Rides List */}
        {!error && filteredRides.length === 0 && rides.length > 0 && (
          <div className="bg-gray-100 rounded-2xl p-8 text-center">
            <Search size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No rides found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setDateRange('all')
                setSortBy('date-desc')
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {!error && rides.length === 0 && (
          <div className="bg-gray-100 rounded-2xl p-8 text-center">
            <CheckCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No completed rides yet</h3>
            <p className="text-gray-500">Your completed rides will appear here after you finish your first ride.</p>
          </div>
        )}

        {!error && filteredRides.map((ride) => (
          <HistoryRideCard key={ride.id} ride={ride} />
        ))}
      </div>

      <BottomNav />
    </div>
  )
}