import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Calendar, MapPin, Clock, User, ArrowRight, Loader, Phone, Mail, Car } from 'lucide-react'
import { Button } from '../components/shared/Button'

export default function RideConfirmationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [justConfirmed, setJustConfirmed] = useState(false) // New state to track if just confirmed
  const [ride, setRide] = useState(null)

  const rideId = searchParams.get('rideId')
  const token = searchParams.get('token')

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

  useEffect(() => {
    if (!rideId || !token) {
      setError('Invalid confirmation link. Please check your email and try again.')
      setLoading(false)
      return
    }

    fetchRideDetails()
  }, [rideId, token])

  const fetchRideDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}/details?token=${token}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ride not found or confirmation link has expired.')
        } else if (response.status === 400) {
          throw new Error('Invalid or expired confirmation token.')
        } else {
          throw new Error('Failed to load ride details. Please try again.')
        }
      }

      const rideData = await response.json()
      setRide(rideData)
    } catch (err) {
      console.error('Error fetching ride details:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmRide = async () => {
    try {
      setConfirming(true)
      setError('')

      const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('This ride has already been confirmed or the link has expired.')
        } else if (response.status === 404) {
          throw new Error('Ride not found.')
        } else {
          throw new Error('Failed to confirm ride. Please try again.')
        }
      }

      const result = await response.json()
      setJustConfirmed(true) // Mark as just confirmed
      setRide(prev => ({ ...prev, status: 'confirmed' }))
    } catch (err) {
      console.error('Error confirming ride:', err)
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Not scheduled'
    try {
      const [hours, minutes] = timeStr.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return timeStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    )
  }

  if (error && !ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Ride</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
              <p className="text-sm text-gray-500">
                Need help? Call <strong>(555) 123-4567</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              ride?.status === 'confirmed' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <Car className={`w-8 h-8 ${
                ride?.status === 'confirmed' ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ride?.status === 'confirmed' ? 'Transportation Confirmed' : 'Confirm Your Transportation'}
            </h1>
            <p className="text-gray-600">
              {ride?.status === 'confirmed' 
                ? 'Your ride has been successfully confirmed' 
                : 'Please review your ride details and confirm your appointment'
              }
            </p>
          </div>
        </div>

        {/* Success Message for Just Confirmed */}
        {justConfirmed && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-green-800">Ride Confirmed Successfully!</h3>
            </div>
            <p className="text-green-700 mb-2">
              Thank you for confirming your transportation. We'll be in touch with pickup details soon.
            </p>
            <p className="text-green-600 text-sm">
              You'll receive updates about your driver and pickup time via email and SMS.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2 shrink-0" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Ride Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            Transportation Details for {ride?.patientName}
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="font-medium text-gray-900">Appointment Date</p>
                <p className="text-gray-600">{formatDate(ride?.appointmentDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="font-medium text-gray-900">Appointment Time</p>
                <p className="text-gray-600">{formatTime(ride?.appointmentTime)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="font-medium text-gray-900">Pickup Location</p>
                <p className="text-gray-600">{ride?.pickupLocation || 'To be confirmed'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="font-medium text-gray-900">Destination</p>
                <p className="text-gray-600">{ride?.providerLocation}</p>
              </div>
            </div>

            {ride?.providerName && (
              <div className="flex items-start gap-3">
                <User className="text-gray-400 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Healthcare Provider</p>
                  <p className="text-gray-600">{ride.providerName}</p>
                </div>
              </div>
            )}

            {ride?.roundTrip && (
              <div className="flex items-start gap-3">
                <ArrowRight className="text-gray-400 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Round Trip</p>
                  <p className="text-gray-600">Return transportation included</p>
                </div>
              </div>
            )}

            {ride?.notes && (
              <div className="flex items-start gap-3">
                <AlertCircle className="text-gray-400 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Special Notes</p>
                  <p className="text-gray-600">{ride.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Status */}
        {ride?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Clock className="text-yellow-600 mr-2" size={20} />
              <div>
                <h3 className="font-medium text-yellow-800">Confirmation Required</h3>
                <p className="text-yellow-700 text-sm">
                  Please confirm this ride to secure your transportation
                </p>
              </div>
            </div>
          </div>
        )}

        {ride?.status === 'confirmed' && !justConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle2 className="text-green-600 mr-2" size={20} />
              <div>
                <h3 className="font-medium text-green-800">Ride Confirmed</h3>
                <p className="text-green-700 text-sm">
                  This ride has been confirmed. You'll receive updates about your driver soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {ride?.status === 'pending' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                onClick={confirmRide}
                disabled={confirming}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirm My Ride
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('tel:+15551234567')}
                className="flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                Call to Modify
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              By confirming, you agree to be ready for pickup at the scheduled time
            </p>
          </div>
        )}

        {/* What's Next Section - Only show when confirmed */}
        {ride?.status === 'confirmed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              What happens next?
            </h3>
            <div className="space-y-2 text-blue-700 text-sm">
              <p>• We'll contact you 24-48 hours before your appointment with driver details</p>
              <p>• You'll receive the driver's name, vehicle information, and contact number</p>
              <p>• Please be ready 15 minutes before your scheduled pickup time</p>
              <p>• If you need to make changes, contact us as soon as possible</p>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4 font-medium">
              Questions or need to make changes?
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="tel:+15551234567" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                <Phone size={14} />
                (555) 123-4567
              </a>
              <a href="mailto:support@medirideportal.com" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                <Mail size={14} />
                Email Support
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Available Monday - Friday, 7:00 AM - 7:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}