import { MapPin, Calendar, Clock, CheckCircle, AlertCircle, ChevronRight, Star, TrendingUp } from 'lucide-react'
import { Card } from '../shared/Card'

export const EnhancedRideCard = ({ ride, onAccept, onView }) => {
  const acceptance = ride.acceptance || {}
  const { score = 0, rank = 0, factors = {}, eligible = true, reason = '' } = acceptance

  // Get score color and badge
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getScoreBadge = (score) => {
    if (score >= 80) return '⭐ Excellent Match'
    if (score >= 60) return '👍 Good Match'
    if (score >= 40) return '👌 Fair Match'
    return '⚠️ Poor Match'
  }

  return (
    <Card className={`mb-3 relative ${!eligible ? 'opacity-60 border-gray-300' : ''}`}>
      {/* Rank Badge */}
      {rank <= 3 && eligible && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10">
          #{rank}
        </div>
      )}

      {/* Acceptance Score Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">{ride.patientName}</h3>
            <p className="text-sm text-gray-500">ID: {ride.patientId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getScoreColor(score)}`}>
            {getScoreBadge(score)}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{score.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">Match Score</div>
          </div>
        </div>
      </div>

      {/* Acceptance Factors */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        {factors.distance && (
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-blue-700">
              {factors.distance.totalDistance ? factors.distance.totalDistance.toFixed(1) : factors.distance.distance?.toFixed(1)} mi
            </div>
            <div className="text-blue-600">Total Trip</div>
          </div>
        )}
        {factors.distance?.totalTime && (
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-green-700">
              {Math.round(factors.distance.totalTime / 60)}h {factors.distance.totalTime % 60}m
            </div>
            <div className="text-green-600">Total Time</div>
          </div>
        )}
        {factors.urgency && (
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-purple-700">
              {factors.urgency.isUrgent ? 'High' : 'Normal'}
            </div>
            <div className="text-purple-600">Priority</div>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {/* Pickup Location */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Pickup</p>
            <p className="text-sm text-gray-900 leading-snug">{ride.pickupLocation}</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Destination</p>
            <p className="text-sm text-gray-900 leading-snug">{ride.providerLocation}</p>
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
            {ride.dayOfWeek && (
              <p className="text-xs text-gray-500">{ride.dayOfWeek}</p>
            )}
          </div>
        </div>

        {/* Distance & Duration */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {factors.distance && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-gray-700">📍</span>
                  <span className="font-medium">{factors.distance.distance?.toFixed(1)} mi</span>
                  <span className="text-gray-500">to pickup</span>
                </div>
                {factors.distance.totalDistance && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-700">�️</span>
                    <span className="font-medium">{factors.distance.totalDistance.toFixed(1)} mi</span>
                    <span className="text-gray-500">total</span>
                  </div>
                )}
              </>
            )}
            {factors.distance?.duration && (
              <div className="flex items-center gap-1">
                <span className="text-gray-700">⏱️</span>
                <span className="font-medium">{factors.distance.duration}</span>
                <span className="text-gray-500">to pickup</span>
              </div>
            )}
            {factors.distance?.totalTime && (
              <div className="flex items-center gap-1">
                <span className="text-gray-700">🕐</span>
                <span className="font-medium">{Math.floor(factors.distance.totalTime / 60)}h {factors.distance.totalTime % 60}m</span>
                <span className="text-gray-500">total</span>
              </div>
            )}
          </div>
          {ride.roundTrip === 'true' && (
            <div className="mt-2 flex items-center gap-1 text-orange-600 text-xs">
              <span className="text-gray-700">🔄</span>
              <span className="font-medium">Round Trip Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Special Requirements / Notes */}
      {ride.notes && ride.notes.trim() !== '' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-700 mb-1">Notes</p>
              <p className="text-sm text-orange-900">{ride.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Acceptance Reason */}
      <div className="text-xs text-gray-600 mb-3 italic">
        {reason}
      </div>

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
          disabled={!eligible}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors active:scale-95 flex items-center justify-center gap-2 ${
            eligible
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle size={20} />
          {eligible ? 'Accept Ride' : 'Not Eligible'}
        </button>
      </div>
    </Card>
  )
}

export default EnhancedRideCard
