import { MapPin, AlertCircle, Loader } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ehrService } from '../../services/ehrService'

export const TransportationDetailsStep = ({ formData, setFormData, error, organizationId, selectedPatient }) => {
  const [loadingPatientAddress, setLoadingPatientAddress] = useState(false)
  const [hasUserEditedLocation, setHasUserEditedLocation] = useState(false)

  // Set default pickup location from patient address when component mounts or patient changes
  useEffect(() => {
    const setDefaultPickupLocation = async () => {
      // Only set default if user hasn't edited the location and it's empty
      if (selectedPatient && organizationId && !formData.pickupLocation && !hasUserEditedLocation) {
        setLoadingPatientAddress(true)
        try {
          const patientDetails = await ehrService.getPatientDetails(organizationId, selectedPatient.id)
          if (patientDetails.address && patientDetails.address.trim()) {
            setFormData(prev => ({
              ...prev,
              pickupLocation: patientDetails.address
            }))
          }
        } catch (error) {
          console.error('Failed to fetch patient address:', error)
          // If we already have the address from the selected patient, use that
          if (selectedPatient.address && selectedPatient.address.trim()) {
            setFormData(prev => ({
              ...prev,
              pickupLocation: selectedPatient.address
            }))
          }
        } finally {
          setLoadingPatientAddress(false)
        }
      }
    }

    setDefaultPickupLocation()
  }, [selectedPatient, organizationId, formData.pickupLocation, setFormData, hasUserEditedLocation])

  // Reset the edit flag when patient changes
  useEffect(() => {
    setHasUserEditedLocation(false)
  }, [selectedPatient])

  const handlePickupLocationChange = (e) => {
    const value = e.target.value
    setFormData({...formData, pickupLocation: value})
    
    // Mark that user has edited the location once they start typing
    if (!hasUserEditedLocation) {
      setHasUserEditedLocation(true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</span>
          Transportation Details
        </h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pickup Location
        </label>
        <div className="relative">
          <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={formData.pickupLocation || ''}
            onChange={handlePickupLocationChange}
            placeholder={loadingPatientAddress ? "Loading patient address..." : "e.g., Patient's home address"}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingPatientAddress}
            required
          />
          {loadingPatientAddress && (
            <div className="absolute right-3 top-3">
              <Loader size={18} className="animate-spin text-blue-600" />
            </div>
          )}
        </div>
        {selectedPatient?.address && !hasUserEditedLocation && !formData.pickupLocation && (
          <p className="mt-1 text-xs text-gray-500">
            Default: {selectedPatient.address}
          </p>
        )}
      </div>

      {/* Special Requirements */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Special Requirements (Optional)
        </label>
        <textarea
          value={formData.specialRequirements || ''}
          onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
          placeholder="e.g., Oxygen required, mobility assistance needed, allergies, dietary restrictions, etc."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* Round Trip */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.roundTrip || false}
            onChange={(e) => setFormData({...formData, roundTrip: e.target.checked})}
            className="w-5 h-5 rounded cursor-pointer"
          />
          <span className="text-gray-700 font-medium">
            Round trip (return ride after appointment)
          </span>
        </label>
      </div>
    </div>
  )
}