import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { PatientSearchStep } from '../../components/schedule/PatientSearchStep'
import AppointmentSelectionStep from '../../components/schedule/AppointmentSelectionStep'
import { TransportationDetailsStep } from '../../components/schedule/TransportationDetailsStep'
import { Button } from '../../components/shared/Button'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { rideService } from '../../services/rideService'

export default function OrgScheduleRidePage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { organizationId } = useAuthStore()

  // Security check
  if (organizationId !== orgId) {
    return <div>Access Denied</div>
  }

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [formData, setFormData] = useState({
    pickupLocation: '',
    notes: '',
    roundTrip: false,
  })

  // Reset form when page is accessed (fresh start each time)
  useEffect(() => {
    console.log('Schedule ride page mounted/accessed')
    // Always start fresh when navigating to this page
    setCurrentStep(1)
    setSelectedPatient(null)
    setSelectedAppointment(null)
    setFormData({
      pickupLocation: '',
      notes: '',
      roundTrip: false,
    })
    setError('')
    setSuccess('')
    setLoading(false)
  }, [location.pathname])

  const handlePatientSelected = (patient) => {
    setSelectedPatient(patient)
    // Clear subsequent steps when new patient is selected
    setSelectedAppointment(null)
    setFormData({
      pickupLocation: '',
      notes: '',
      roundTrip: false,
    })
    setCurrentStep(2)
  }

  const handleAppointmentSelected = (appointment) => {
    setSelectedAppointment(appointment)
    // Clear transportation details when new appointment is selected
    setFormData(prev => ({
      ...prev,
      pickupLocation: '',
      notes: '',
      roundTrip: false,
    }))
    setCurrentStep(3)
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!selectedPatient || !selectedAppointment) {
      setError('Please complete all steps')
      return
    }

    if (!formData.pickupLocation.trim()) {
      setError('Please enter a pickup location')
      return
    }

    setLoading(true)

    try {
      const rideData = {
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientPhone: selectedPatient.phone,
        patientAddress: selectedPatient.address,
        appointmentId: selectedAppointment.id,
        appointmentDate: selectedAppointment.appointmentDate,
        appointmentTime: selectedAppointment.appointmentTime,
        providerLocation: selectedAppointment.location,
        pickupLocation: formData.pickupLocation,
        appointmentType: selectedAppointment.appointmentType,
        providerName: selectedAppointment.providerName,
        notes: formData.notes,
        roundTrip: formData.roundTrip === true
      }

      const response = await rideService.scheduleRide(orgId, rideData)
      
      setSuccess('Ride scheduled successfully!')
      
      setTimeout(() => {
        navigate(`/org/${orgId}/dashboard`, {
          state: {
            message: 'Ride scheduled successfully!',
            type: 'success'
          }
        })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to schedule ride')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedPatient(null)
    setSelectedAppointment(null)
    setFormData({
      pickupLocation: '',
      pickupTimeOffset: 30,
      transportationType: 'standard',
      notes: '',
      roundTrip: false,
      returnPickupOffset: 30,
    })
    setError('')
  }

  const handleBack = () => {
    if (currentStep > 1) {
      // Clear data when going back
      if (currentStep === 3) {
        // Going back from step 3 to 2, clear transportation details
        setFormData({
          pickupLocation: '',
          notes: '',
          roundTrip: false,
        })
      } else if (currentStep === 2) {
        // Going back from step 2 to 1, clear appointment and transportation
        setSelectedAppointment(null)
        setFormData({
          pickupLocation: '',
          notes: '',
          roundTrip: false,
        })
      }
      setCurrentStep(currentStep - 1)
    } else {
      navigate(`/org/${orgId}/dashboard`)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ride Scheduled!</h2>
            <p className="text-gray-600 mb-6">The ride has been successfully scheduled. Redirecting...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule a Ride</h1>
          <p className="text-gray-600">Step {currentStep} of 3</p>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Patient Search */}
          {currentStep >= 1 && (
            <div className={`mb-8 pb-8 border-b border-gray-200 ${currentStep > 1 ? 'opacity-60' : ''}`}>
              <PatientSearchStep
                organizationId={orgId}
                onPatientSelected={handlePatientSelected}
                onLoading={setLoading}
              />
              {selectedPatient && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Selected Patient:</span> {selectedPatient.firstName} {selectedPatient.lastName} (ID: {selectedPatient.id})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Appointment Selection */}
          {currentStep >= 2 && selectedPatient && (
            <div className={`mb-8 pb-8 border-b border-gray-200 ${currentStep > 2 ? 'opacity-60' : ''}`}>
              <AppointmentSelectionStep
                orgId={orgId}
                patient={selectedPatient}
                onAppointmentSelected={handleAppointmentSelected}
                onBack={() => setCurrentStep(1)}
              />
              {selectedAppointment && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Selected Appointment:</span> {selectedAppointment.appointmentType} on {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.appointmentTime}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Transportation Details */}
          {currentStep >= 3 && selectedAppointment && (
            <TransportationDetailsStep
              formData={formData}
              setFormData={setFormData}
              error={error}
              organizationId={orgId}
              selectedPatient={selectedPatient}
            />
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3 justify-between">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={loading}
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < 3 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  loading ||
                  (currentStep === 1 && !selectedPatient) ||
                  (currentStep === 2 && !selectedAppointment)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Scheduling...' : 'Schedule Ride'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}