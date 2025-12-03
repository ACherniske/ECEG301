import { MapPin, Calendar, Clock, Navigation, Phone, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Card } from '../shared/Card'

export const MyRideCard = ({ ride, onStartRide, onViewDetails, onCall, onCancel }) => {
  const isInProgress = ['en route', 'in transit', 'arrived'].includes(ride.status)
  const isConfirmed = ride.status === 'claimed'

  const handleCancel = () => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (reason && reason.trim()) {
      onCancel(ride, reason.trim())
    }
  }

  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{ride.patientName}</h3>
          <p className="text-sm text-gray-500">ID: {ride.patientId}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
          isInProgress 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {isInProgress ? 'In Progress' : 'Confirmed'}
        </span>
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
            <p className="text-sm text-gray-900 leading-snug">{ride.appointmentLocation || ride.location}</p>
            <p className="text-xs text-gray-600 mt-1">
              📅 {ride.appointmentDate} at {ride.appointmentTime}
            </p>
          </div>
        </div>
      </div>

      {/* Special Requirements */}
      {ride.specialRequirements && ride.specialRequirements.trim() !== '' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-700 mb-1">Special Requirements</p>
              <p className="text-sm text-orange-900">{ride.specialRequirements}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onCall && (
          <button
            onClick={() => onCall(ride)}
            className="px-4 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors active:scale-95 flex items-center justify-center"
          >
            <Phone size={18} />
          </button>
        )}

        {/* Cancel button for non-active rides */}
        {!isInProgress && onCancel && (
          <button
            onClick={handleCancel}
            className="px-4 bg-red-100 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-200 transition-colors active:scale-95 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        )}
        
        {isInProgress ? (
          <button
            onClick={() => onViewDetails(ride)}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            View Active Ride
          </button>
        ) : (
          <button
            onClick={() => onStartRide(ride)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <Navigation size={18} />
            Start Ride
          </button>
        )}
      </div>
    </Card>
  )
}