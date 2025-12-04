import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { PatientSearchStep } from '../../components/schedule/PatientSearchStep'
import AppointmentSelectionStep from '../../components/schedule/AppointmentSelectionStep'
import { TransportationDetailsStep } from '../../components/schedule/TransportationDetailsStep'
import { Button } from '../../components/shared/Button'
import { CheckCircle2, AlertCircle, Mail, MailX, Clock } from 'lucide-react'
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
  const [emailStatus, setEmailStatus] = useState(null)

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [formData, setFormData] = useState({
    pickupLocation: '',
    notes: '',
    roundTrip: false,
  })

  // Reset form when page is accessed (fresh start each time)
  useEffect(() => {
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
    setEmailStatus(null)
    setLoading(false)
  }, [location.pathname])

  const handlePatientSelected = (patient) => {
    setSelectedPatient(patient)
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
    setEmailStatus(null)

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
      
      // Set email notification status
      setEmailStatus({
        sent: response.emailSent,
        error: response.emailError,
        patientEmail: response.patientEmail,
        confirmationUrl: response.confirmationUrl
      })
      
      setSuccess('Ride scheduled successfully!')
      
      setTimeout(() => {
        navigate(`/org/${orgId}/dashboard`, {
          state: {
            message: 'Ride scheduled successfully!',
            type: 'success',
            emailStatus: {
              sent: response.emailSent,
              error: response.emailError,
              patientEmail: response.patientEmail
            }
          }
        })
      }, 3000)
    } catch (err) {
      console.error('Ride scheduling error:', err)
      setError(err.message || 'Failed to schedule ride')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 3) {
        setFormData({
          pickupLocation: '',
          notes: '',
          roundTrip: false,
        })
      } else if (currentStep === 2) {
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
            <p className="text-gray-600 mb-4">The ride has been successfully scheduled.</p>
            
            {/* Email Status Display */}
            {emailStatus && (
              <div className="mb-6">
                {emailStatus.sent ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <Mail size={20} />
                      <span className="font-medium">Confirmation Email Sent!</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      Patient will receive an email at <strong>{emailStatus.patientEmail}</strong> to confirm their ride.
                    </p>
                    {emailStatus.confirmationUrl && (
                      <p className="text-green-600 text-xs mt-2">
                        The ride status will change to "confirmed" once the patient confirms via email.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                      <MailX size={20} />
                      <span className="font-medium">Email Not Sent</span>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      {emailStatus.error || 'Unable to send confirmation email to patient.'}
                    </p>
                    <p className="text-yellow-600 text-xs mt-2">
                      Please contact the patient manually to confirm their ride details.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Clock size={16} />
              <span>Redirecting to dashboard...</span>
            </div>
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
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Selected Patient:</span> {selectedPatient.firstName} {selectedPatient.lastName} (ID: {selectedPatient.id})
                    </p>
                  </div>
                  {selectedPatient.email && (
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      📧 Confirmation email will be sent to: {selectedPatient.email}
                    </p>
                  )}
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
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Selected Appointment:</span> {selectedAppointment.appointmentType} on {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.appointmentTime}
                    </p>
                  </div>
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
                {loading ? 'Scheduling...' : 'Schedule Ride & Send Confirmation'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}