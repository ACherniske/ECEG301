import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Phone, CheckCircle, AlertCircle, ChevronLeft, X } from 'lucide-react'
import { useRideStore } from '../store/rideStore'
import { useDriverStore } from '../store/driverStore'
import { rideService } from '../services/rideService'
import { Button } from '../components/shared/Button'

export default function ActiveRidePage() {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const { activeRide, setActiveRide, updateRideStatus, clearActiveRide } = useRideStore()
  const { organizationId } = useDriverStore()
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load ride details if not in state
    if (!activeRide || activeRide.id !== rideId) {
      // TODO: Fetch ride details from backend
      console.log('Load ride:', rideId)
    }
  }, [rideId, activeRide])

  const handleNavigate = () => {
    const destination = encodeURIComponent(activeRide.appointmentLocation || activeRide.location)
    const origin = encodeURIComponent(activeRide.pickupLocation || activeRide.patientAddress)
    
    // Open Google Maps with directions
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
      '_blank'
    )
  }

  const handleCall = () => {
    // Open phone dialer
    window.location.href = `tel:${activeRide.patientPhone || ''}`
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      await rideService.completeRide(organizationId, activeRide.id, activeRide.rowIndex)
      updateRideStatus(activeRide.id, 'completed')
      clearActiveRide()
      navigate('/my-rides')
    } catch (error) {
      console.error('Failed to complete ride:', error)
      alert('Failed to complete ride. Please try again.')
    } finally {
      setLoading(false)
      setShowCompleteModal(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      await rideService.cancelRide(organizationId, activeRide.id, 'Driver cancelled', activeRide.rowIndex)
      updateRideStatus(activeRide.id, 'cancelled')
      clearActiveRide()
      navigate('/my-rides')
    } catch (error) {
      console.error('Failed to cancel ride:', error)
      alert('Failed to cancel ride. Please try again.')
    } finally {
      setLoading(false)
      setShowCancelModal(false)
    }
  }

  if (!activeRide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading ride details...</p>
          <Button onClick={() => navigate('/my-rides')} variant="secondary">
            Back to My Rides
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 pb-8">
        <button
          onClick={() => navigate('/my-rides')}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={24} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-2">Active Ride</h1>
        <p className="text-green-100">In Progress</p>
      </div>

      <div className="p-4 -mt-4">
        {/* Main Ride Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeRide.patientName}</h2>
              <p className="text-sm text-gray-500">{activeRide.patientId}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Navigation size={32} className="text-green-600" />
            </div>
          </div>

          {/* Route Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">PICKUP</p>
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {activeRide.pickupLocation || activeRide.patientAddress}
                </p>
                <p className="text-sm text-blue-600 font-bold">🕐 {activeRide.pickupTime}</p>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-dashed border-gray-300 h-8"></div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">DESTINATION</p>
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {activeRide.appointmentLocation || activeRide.location}
                </p>
                <p className="text-sm text-gray-600">
                  📅 {activeRide.appointmentDate} at {activeRide.appointmentTime}
                </p>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {activeRide.specialRequirements && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-orange-700 mb-1">SPECIAL REQUIREMENTS</p>
                  <p className="text-sm text-orange-900">{activeRide.specialRequirements}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation & Call Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={handleNavigate}
              variant="primary"
              size="lg"
              className="flex-1"
              icon={Navigation}
            >
              Navigate
            </Button>
            <button
              onClick={handleCall}
              className="px-6 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors active:scale-95 flex items-center justify-center"
            >
              <Phone size={20} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => setShowCompleteModal(true)}
            variant="success"
            size="lg"
            fullWidth
            icon={CheckCircle}
          >
            Complete Ride
          </Button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full bg-red-100 text-red-700 py-4 rounded-xl font-semibold hover:bg-red-200 transition-colors active:scale-95"
          >
            Cancel Ride
          </button>
        </div>
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Complete Ride?</h3>
              <button onClick={() => setShowCompleteModal(false)}>
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Confirm that you have successfully dropped off {activeRide.patientName} at their destination.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCompleteModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                variant="success"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Cancel Ride?</h3>
              <button onClick={() => setShowCancelModal(false)}>
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this ride? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={handleCancel}
                variant="danger"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Cancelling...' : 'Cancel Ride'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}