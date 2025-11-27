import { useParams, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { useRideStore } from '../../store/rideStore'
import { useEffect, useState } from 'react'
import { RideListItem } from '../../components/dashboard/RideListItem'
import { Calendar, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '../../components/shared/Button'

export default function OrgRideHistoryPage() {
  const { orgId } = useParams()
  const location = useLocation()
  const { fetchRides, allRides, updateRideStatus, clearData } = useRideStore()
  const [filteredRides, setFilteredRides] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh when page is accessed
  useEffect(() => {
    console.log('Ride history page mounted/accessed')
    if (orgId) {
      // Clear any existing error/success messages when switching to this page
      setError('')
      setSuccess('')
      
      // Force refresh rides data
      setIsRefreshing(true)
      clearData()
      fetchRides(orgId).finally(() => setIsRefreshing(false))
    }
  }, [orgId, location.pathname, fetchRides, clearData])

  // Check for success messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      if (location.state.type === 'success') {
        setSuccess(location.state.message)
        setTimeout(() => setSuccess(''), 5000)
      } else if (location.state.type === 'error') {
        setError(location.state.message)
        setTimeout(() => setError(''), 5000)
      }
    }
  }, [location.state])

  // Filter and sort rides whenever allRides or filter changes
  useEffect(() => {
    let rides = [...allRides]

    // Apply status filter
    if (statusFilter !== 'all') {
      rides = rides.filter(ride => ride.status.toLowerCase() === statusFilter)
    }

    // Sort by appointment date in reverse chronological order (newest first)
    rides.sort((a, b) => {
      const dateA = new Date(a.appointmentDate)
      const dateB = new Date(b.appointmentDate)
      return dateB - dateA
    })

    setFilteredRides(rides)
    setCurrentPage(1) // Reset to first page when filter changes
  }, [allRides, statusFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredRides.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRides = filteredRides.slice(startIndex, endIndex)

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError('')
    setSuccess('')
    
    try {
      clearData()
      await fetchRides(orgId)
      setSuccess('Ride history refreshed')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to refresh ride history')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle status update
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

  // Handle ride update (for editing fields)
  const handleRideUpdate = async (rideId, updatedRide) => {
    console.log('Update ride:', rideId, updatedRide)
    setSuccess('Ride updated successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1) // Reset to first page
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ride History</h1>
            <p className="text-gray-600">View and manage all past and upcoming rides</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            {success}
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-600 font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredRides.length)} of {filteredRides.length} rides
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Rides per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rides List */}
        <div className="bg-white rounded-2xl p-6">
          {currentRides.length > 0 ? (
            <div className="space-y-4">
              {currentRides.map((ride) => (
                <div key={ride.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  {/* Date header for each ride */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium">
                    <Calendar size={14} />
                    <span>{formatDate(ride.appointmentDate)}</span>
                  </div>
                  
                  <RideListItem 
                    ride={ride}
                    onStatusUpdate={handleStatusUpdate}
                    onRideUpdate={handleRideUpdate}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No rides found</p>
              <p className="text-sm">
                {statusFilter === 'all' 
                  ? 'No rides have been scheduled yet.'
                  : `No rides with status "${statusFilter}" found.`}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-2xl p-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)

                const showEllipsis = 
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)

                if (showEllipsis) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      ...
                    </span>
                  )
                }

                if (!showPage) return null

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}