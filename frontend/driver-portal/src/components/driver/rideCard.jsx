import { MapPin, Calendar, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { Card } from '../shared/Card'

export const RideCard = ({ ride, onAccept, onView }) => {
  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{ride.patientName}</h3>
          <p className="text-sm text-gray-500">ID: {ride.patientId}</p>
        </div>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold shrink-0">
          Pending
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {/* Pickup Location */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Pickup</p>
            <p className="text-sm text-gray-900 leading-snug">{ride.pickupLocation || ride.patientAddress}</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Destination</p>
            <p className="text-sm text-gray-900 leading-snug">{ride.appointmentLocation || ride.location}</p>
          </div>
        </div>

        {/* Appointment Time */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Calendar size={16} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Appointment</p>
            <p className="text-sm text-gray-900 font-medium">
              {ride.appointmentDate} at {ride.appointmentTime}
            </p>
          </div>
        </div>

        {/* Distance & Duration (if available) */}
        {ride.distance && (
          <div className="flex items-center gap-4 text-sm bg-gray-50 rounded-lg p-2">
            <span className="text-gray-700">📍 {ride.distance}</span>
            {ride.estimatedDuration && (
              <span className="text-gray-700">⏱️ {ride.estimatedDuration}</span>
            )}
          </div>
        )}
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
        {onView && (
          <button
            onClick={() => onView(ride)}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            View Details
            <ChevronRight size={18} />
          </button>
        )}
        <button
          onClick={() => onAccept(ride)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          Accept Ride
        </button>
      </div>
    </Card>
  )
}