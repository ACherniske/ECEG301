import { useState } from 'react'
import { X, Clock, MapPin, Calendar, CheckCircle, Car } from 'lucide-react'
import { Button } from './shared/Button'
import { useDriverStore } from '../../store/driverStore'

export const AcceptRideModal = ({ ride, onClose, onConfirm }) => {
  const { driver } = useDriverStore()
  const [pickupTime, setPickupTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!pickupTime) return
    
    setLoading(true)
    try {
      await onConfirm(ride, pickupTime)
    } catch (error) {
      console.error('Failed to accept ride:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate suggested pickup time (30 minutes before appointment)
  const getSuggestedPickupTime = () => {
    if (!ride.appointmentTime) return ''
    
    const [hours, minutes] = ride.appointmentTime.split(':')
    const appointmentDate = new Date()
    appointmentDate.setHours(parseInt(hours), parseInt(minutes))
    appointmentDate.setMinutes(appointmentDate.getMinutes() - 30)
    
    return appointmentDate.toTimeString().slice(0, 5)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
        <div className="p-6 pb-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Accept Ride</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Ride Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-blue-900">{ride.patientName}</h3>
                <p className="text-sm text-blue-700">ID: {ride.patientId}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <MapPin size={24} className="text-white" />
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-blue-700 font-medium">{ride.appointmentLocation || ride.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600 shrink-0" />
                <p className="text-blue-700">
                  {ride.appointmentDate} at {ride.appointmentTime}
                </p>
              </div>
            </div>
          </div>

          {/* Pickup Time Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Calculate Pickup Time *
            </label>
            <div className="relative">
              <Clock size={20} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Consider travel time and traffic conditions
              </p>
              <button
                type="button"
                onClick={() => setPickupTime(getSuggestedPickupTime())}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Suggest Time
              </button>
            </div>
          </div>

          {/* Your Vehicle Info */}
          {driver && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Car size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Vehicle</p>
                  <p className="text-sm font-bold text-gray-900">
                    {driver.carMake} {driver.carModel}
                  </p>
                  <p className="text-xs text-gray-600">{driver.licensePlate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Special Requirements Warning */}
          {ride.specialRequirements && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-orange-700 font-bold text-sm">!</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-700 mb-1">Special Requirements</p>
                  <p className="text-sm text-orange-900">{ride.specialRequirements}</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!pickupTime || loading}
            variant="primary"
            size="lg"
            fullWidth
            icon={CheckCircle}
          >
            {loading ? 'Accepting...' : 'Confirm & Accept Ride'}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            By accepting, you commit to picking up the patient at the specified time
          </p>
        </div>
      </div>
    </div>
  )
}