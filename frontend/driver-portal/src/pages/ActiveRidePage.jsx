import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Navigation, CheckCircle, AlertCircle, ChevronLeft, X, Clock, ArrowRight, Car, Home, Calendar } from 'lucide-react'
import { useRideStore } from '../store/rideStore'
import { useDriverStore } from '../store/driverStore'
import { rideService } from '../services/rideService'
import { Button } from '../components/shared/button'

export default function ActiveRidePage() {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const { activeRide, setActiveRide, updateRideStatus, clearActiveRide } = useRideStore()
  const { organizationId } = useDriverStore()
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Define ride stages and their corresponding statuses
  // Comprehensive round trip detection
  const roundTripValue = activeRide?.roundTrip
  const hasReturnTrip = !!(
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
  
  const rideStages = [
    {
      id: 'go_to_pickup',
      status: 'en route', 
      title: 'Go to Pickup',
      description: 'Navigate to patient pickup location',
      icon: Car,
      color: 'blue',
      stageNumber: 1
    },
    {
      id: 'patient_picked_up',
      status: 'in transit',
      title: 'Patient Picked Up',
      description: 'Transport patient to appointment',
      icon: Navigation,
      color: 'orange',
      stageNumber: 2
    },
    {
      id: 'arrived_at_appointment',
      status: 'arrived',
      title: 'Arrived at Destination',
      description: 'Patient at appointment location',
      icon: MapPin,
      color: 'green',
      stageNumber: 3
    }
  ]

  // Add return trip stages if applicable
  if (hasReturnTrip) {
    rideStages.push(
      {
        id: 'go_to_return_pickup',
        status: 'en route', 
        title: 'Go to Return Pickup',
        description: 'Navigate back to pickup patient after appointment',
        icon: Car,
        color: 'purple',
        stageNumber: 4,
        isReturnStage: true
      },
      {
        id: 'return_journey',
        status: 'in transit',
        title: 'Return Journey',
        description: 'Transport patient back home',
        icon: Home,
        color: 'indigo',
        stageNumber: 5,
        isReturnStage: true
      }
    )
  }

  const getCurrentStageIndex = () => {
    const status = activeRide?.status || 'claimed'
    
    // If we have a stored currentStage, use it
    if (activeRide?.currentStage !== undefined && activeRide?.currentStage >= 0) {
      return Math.min(activeRide.currentStage, rideStages.length - 1)
    }
    
    // Otherwise, determine stage from status
    if (status === 'claimed') {
      return 0 // Not started yet, show first stage
    }
    
    // For standard rides, simple mapping
    if (!hasReturnTrip) {
      switch (status) {
        case 'en route': return 0
        case 'in transit': return 1
        case 'arrived': return 2
        default: return 0
      }
    }
    
    // For round trips, we need to be more careful
    // Default to mapping based on status if no currentStage is stored
    switch (status) {
      case 'en route': 
        // Could be stage 0 (initial pickup) or stage 3 (return pickup)
        // Default to stage 0 if not specified
        return 0
      case 'in transit':
        // Could be stage 1 (to appointment) or stage 4 (return home)
        // Default to stage 1 if not specified
        return 1
      case 'arrived':
        return 2
      case 'completed':
        return rideStages.length - 1
      default:
        return 0
    }
  }

  const currentStageIndex = getCurrentStageIndex()
  const currentStage = rideStages[currentStageIndex]

  useEffect(() => {
    // Load ride details if not in state
    if (!activeRide || activeRide.id !== rideId) {
      // TODO: Fetch ride details from backend
      console.log('Load ride:', rideId)
    }
  }, [rideId, activeRide])

  const getNavigationDestination = () => {
    const stage = currentStage
    if (!stage) return { origin: '', destination: '' }

    const origin = encodeURIComponent(activeRide.driverAddress || '')
    
    // Handle navigation based on stage ID for round trips
    switch (stage.id) {
      case 'go_to_pickup':
        // Navigate from driver location to pickup
        return {
          origin,
          destination: encodeURIComponent(activeRide.pickupLocation || activeRide.patientAddress)
        }
      case 'patient_picked_up':
        // Navigate from pickup to appointment
        return {
          origin: encodeURIComponent(activeRide.pickupLocation || activeRide.patientAddress),
          destination: encodeURIComponent(activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location)
        }
      case 'arrived_at_appointment':
        // Stay at appointment location
        return {
          origin: encodeURIComponent(activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location),
          destination: encodeURIComponent(activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location)
        }
      case 'go_to_return_pickup':
        // Navigate from appointment back to pickup patient location
        return {
          origin: encodeURIComponent(activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location),
          destination: encodeURIComponent(activeRide.pickupLocation || activeRide.patientAddress)
        }
      case 'return_journey':
        // Navigate from provider location back to pickup location to get patient
        return {
          origin: encodeURIComponent(activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location),
          destination: encodeURIComponent(activeRide.pickupLocation || activeRide.patientAddress)
        }
      default:
        return {
          origin,
          destination: encodeURIComponent(activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location)
        }
    }
  }

  const handleNavigate = () => {
    const { origin, destination } = getNavigationDestination()
    
    // Open Google Maps with directions
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
      '_blank'
    )
  }

  const handleNextStage = async () => {
    if (currentStageIndex >= rideStages.length - 1) {
      // Last stage - complete the ride
      setShowCompleteModal(true)
      return
    }

    const nextStage = rideStages[currentStageIndex + 1]
    const nextStageIndex = currentStageIndex + 1
    setLoading(true)
    
    try {
      await rideService.updateRideStatus(activeRide.id, nextStage.status)
      
      // Update the ride status in the store
      updateRideStatus(activeRide.id, nextStage.status)
      
      // Update the active ride object with both status and explicit stage tracking
      const updatedRide = { 
        ...activeRide, 
        status: nextStage.status,
        currentStage: nextStageIndex // Critical for round trips to track actual stage
      }
      setActiveRide(updatedRide)
      
      // Show success feedback
      console.log(`Stage updated to: ${nextStage.title} (Stage ${nextStageIndex + 1}/${rideStages.length})`)
      
    } catch (error) {
      console.error('Failed to update ride status:', error)
      alert('Failed to update ride status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      await rideService.updateRideStatus(activeRide.id, 'completed')
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
      const reason = 'Driver cancelled from active ride page'
      await rideService.cancelRide(activeRide.id, reason)
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
        <p className="text-green-100">{currentStage?.title || 'In Progress'}</p>
      </div>

      <div className="p-4 -mt-4">
        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeRide.patientName}</h2>
              <p className="text-sm text-gray-500">{activeRide.patientId}</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              currentStage?.color === 'blue' ? 'bg-blue-100' :
              currentStage?.color === 'orange' ? 'bg-orange-100' :
              currentStage?.color === 'green' ? 'bg-green-100' :
              currentStage?.color === 'purple' ? 'bg-purple-100' :
              currentStage?.color === 'indigo' ? 'bg-indigo-100' :
              'bg-green-100'
            }`}>
              {currentStage?.icon && (
                <currentStage.icon size={32} className={
                  currentStage?.color === 'blue' ? 'text-blue-600' :
                  currentStage?.color === 'orange' ? 'text-orange-600' :
                  currentStage?.color === 'green' ? 'text-green-600' :
                  currentStage?.color === 'purple' ? 'text-purple-600' :
                  currentStage?.color === 'indigo' ? 'text-indigo-600' :
                  'text-green-600'
                } />
              )}
            </div>
          </div>

          {/* Current Stage Description */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{currentStage?.title}</h3>
            <p className="text-gray-600">{currentStage?.description}</p>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Progress</h3>
          <div className="space-y-4">
            {rideStages.map((stage, index) => {
              const isCompleted = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const isUpcoming = index > currentStageIndex
              const StageIcon = stage.icon

              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted ? 'bg-green-100' :
                    isCurrent ? `bg-${stage.color}-100` :
                    'bg-gray-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <StageIcon size={20} className={
                        isCurrent ? 
                        (stage.color === 'blue' ? 'text-blue-600' :
                         stage.color === 'orange' ? 'text-orange-600' :
                         stage.color === 'green' ? 'text-green-600' :
                         stage.color === 'purple' ? 'text-purple-600' :
                         stage.color === 'indigo' ? 'text-indigo-600' :
                         'text-green-600') :
                        'text-gray-400'
                      } />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {stage.title}
                    </p>
                    <p className={`text-sm ${
                      isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {stage.description}
                    </p>
                  </div>
                  {isCurrent && (
                    <div className="text-sm text-blue-600 font-semibold px-3 py-1 bg-blue-50 rounded-full">
                      Current
                    </div>
                  )}
                  {isCompleted && (
                    <CheckCircle size={20} className="text-green-600" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Route Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">PICKUP</p>
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {activeRide.pickupLocation || activeRide.patientAddress}
                </p>
                <p className="text-sm text-blue-600 font-bold flex items-center gap-1">
                  <Clock size={14} /> {activeRide.pickupTime}
                </p>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-dashed border-gray-300 h-8"></div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">DESTINATION</p>
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {activeRide.providerLocation || activeRide.appointmentLocation || activeRide.location}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar size={14} /> {activeRide.appointmentDate} at {activeRide.appointmentTime}
                </p>
              </div>
            </div>

            {hasReturnTrip && (
              <>
                <div className="ml-5 border-l-2 border-dashed border-gray-300 h-8"></div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Home size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">RETURN DESTINATION</p>
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {activeRide.pickupLocation || activeRide.patientAddress}
                    </p>
                    <p className="text-sm text-purple-600 font-bold">Round Trip</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Special Requirements */}
        {activeRide.specialRequirements && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-orange-700 mb-1">SPECIAL REQUIREMENTS</p>
                  <p className="text-sm text-orange-900">{activeRide.specialRequirements}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Navigation Button */}
          <Button
            onClick={handleNavigate}
            variant={currentStage?.id === 'arrived_at_appointment' ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            icon={Navigation}
            disabled={currentStage?.id === 'arrived_at_appointment'}
          >
            {currentStage?.id === 'arrived_at_appointment' ? 
              'Arrived at Destination' :
              `Navigate to ${currentStage?.title.includes('Pickup') ? 'Pickup' : 
                          currentStage?.title.includes('Return') ? 'Return Location' : 'Destination'}`}
          </Button>

          {/* Next Stage Button */}
          <Button
            onClick={handleNextStage}
            variant="success"
            size="lg"
            fullWidth
            icon={currentStageIndex >= rideStages.length - 1 ? CheckCircle : ArrowRight}
            disabled={loading}
          >
            {loading ? 'Updating...' : 
             currentStageIndex >= rideStages.length - 1 ? 'Complete Ride' :
             `Mark as ${rideStages[currentStageIndex + 1]?.title}`}
          </Button>

          {/* Cancel Button */}
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