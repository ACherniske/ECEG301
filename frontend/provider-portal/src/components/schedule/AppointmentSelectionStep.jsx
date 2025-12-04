import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Car, AlertTriangle } from 'lucide-react'
import { rideService } from '../../services/rideService'
import { Button } from '../shared/Button'
import api from '../../services/api'

const AppointmentCard = ({ appointment, hasRide, onSelect, disabled }) => {
  const isPastAppointment = rideService.isAppointmentInPast(appointment.appointmentDate, appointment.appointmentTime)
  
  return (
    <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
      disabled || isPastAppointment
        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
        : hasRide
          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
    }`}
    onClick={() => !disabled && !isPastAppointment && onSelect(appointment)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="font-medium text-gray-900">{appointment.appointmentDate}</span>
            <Clock size={16} className="text-gray-500" />
            <span className="text-gray-700">{appointment.appointmentTime}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-gray-500" />
            <span className="text-gray-700">{appointment.location}</span>
          </div>

          {appointment.appointmentType && (
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-gray-500" />
              <span className="text-gray-700">{appointment.appointmentType}</span>
            </div>
          )}
          
          {appointment.providerName && (
            <p className="text-sm text-gray-600 mb-2">Provider: {appointment.providerName}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {isPastAppointment && (
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <AlertTriangle size={16} />
              <span>Past</span>
            </div>
          )}
          
          {hasRide && !isPastAppointment && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <Car size={16} />
              <span>Ride Scheduled</span>
            </div>
          )}
          
          {!hasRide && !isPastAppointment && (
            <div className="text-green-600 text-sm font-medium">
              Available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppointmentSelectionStep({ 
  patient, 
  onAppointmentSelected, 
  onBack,
  orgId 
}) {
  const [appointments, setAppointments] = useState([])
  const [ridesMap, setRidesMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!patient?.id || !orgId) {
        setError('Missing patient ID or organization ID')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        setError('')
        setDebugInfo(`Loading appointments for patient ${patient.id} in org ${orgId}...`)
        
        // Load appointments with detailed error handling
        let appointmentsData = []
        try {
          setDebugInfo('Fetching appointments from API...')
          const appointmentsResponse = await api.get(`/org/${orgId}/patients/${patient.id}/appointments`)
          appointmentsData = appointmentsResponse.data
          setDebugInfo(`API call successful. Found ${appointmentsData.length} appointments.`)
        } catch (apiError) {
          console.error('Appointments API error:', apiError)
          setDebugInfo(`API Error: ${apiError.response?.status} - ${apiError.response?.data?.error || apiError.message}`)
          
          // If API fails, use mock data for now
          appointmentsData = [
            {
              id: 'mock-apt-001',
              appointmentDate: '2024-12-01',
              appointmentTime: '10:00 AM',
              appointmentType: 'Cardiology Consultation',
              location: 'Main Hospital - Cardiology Wing',
              providerName: 'Dr. Smith'
            },
            {
              id: 'mock-apt-002',
              appointmentDate: '2024-12-05',
              appointmentTime: '2:00 PM',
              appointmentType: 'Follow-up',
              location: 'Outpatient Clinic',
              providerName: 'Dr. Johnson'
            }
          ]
          setDebugInfo(prev => prev + ' Using mock data instead.')
        }
        
        setAppointments(appointmentsData)
        
        // Load rides data
        setDebugInfo(prev => prev + ' Loading existing rides...')
        const ridesData = await rideService.getRides(orgId)
        
        // Create a map of appointments that have rides
        const ridesForPatient = ridesData.filter(ride => 
          ride.patientId === patient.id &&
          ride.status !== 'cancelled' &&
          ride.status !== 'completed'
        )
        
        const rideMap = new Map()
        ridesForPatient.forEach(ride => {
          if (ride.appointmentId) {
            rideMap.set(`id-${ride.appointmentId}`, ride)
          }
          const dateTimeKey = `${ride.appointmentDate}-${ride.appointmentTime}`
          rideMap.set(dateTimeKey, ride)
        })
        
        setRidesMap(rideMap)
        setDebugInfo(prev => prev + ` Found ${ridesForPatient.length} existing rides for this patient.`)
        
      } catch (err) {
        console.error('Error in loadData:', err)
        setError(`Failed to load data: ${err.message}`)
        setDebugInfo(`Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [patient?.id, orgId])

  const handleAppointmentSelect = (appointment) => {
    const appointmentForRide = {
      ...appointment,
      appointmentId: appointment.id,
      appointmentLocation: appointment.location,
      notes: appointment.appointmentType ? `Appointment Type: ${appointment.appointmentType}` : ''
    }
    
    onAppointmentSelected(appointmentForRide)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg mb-2">Loading appointments...</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Patient: {patient?.firstName} {patient?.lastName} (ID: {patient?.id})</p>
          <p>Organization: {orgId}</p>
          {debugInfo && <p className="text-blue-600">{debugInfo}</p>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <div className="text-sm text-gray-500 mb-4 space-y-1">
          <p>Patient: {patient?.firstName} {patient?.lastName} (ID: {patient?.id})</p>
          <p>Organization: {orgId}</p>
          {debugInfo && <p className="text-blue-600">{debugInfo}</p>}
        </div>
        <div className="space-y-2">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No appointments found for {patient?.firstName} {patient?.lastName}</p>
        <div className="text-sm text-gray-400 mb-4 space-y-1">
          <p>Patient ID: {patient?.id}</p>
          <p>Organization: {orgId}</p>
          {debugInfo && <p className="text-blue-600">{debugInfo}</p>}
        </div>
        <Button variant="outline" onClick={onBack}>
          Select Different Patient
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select Appointment for Transportation
        </h3>
        <p className="text-sm text-gray-600">
          Patient: <span className="font-medium">{patient?.firstName} {patient?.lastName}</span>
        </p>
        {debugInfo && (
          <p className="text-xs text-blue-600 mt-1">{debugInfo}</p>
        )}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {appointments.map((appointment, index) => {
          const appointmentIdKey = `id-${appointment.id}`
          const dateTimeKey = `${appointment.appointmentDate}-${appointment.appointmentTime}`
          const hasRide = ridesMap.has(appointmentIdKey) || ridesMap.has(dateTimeKey)
          
          return (
            <AppointmentCard
              key={`${appointment.id || appointment.appointmentDate}-${appointment.appointmentTime}-${index}`}
              appointment={appointment}
              hasRide={hasRide}
              onSelect={handleAppointmentSelect}
              disabled={loading}
            />
          )
        })}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-blue-600 mt-1" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Transportation Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Only future appointments can have transportation scheduled</li>
              <li>Appointments that already have rides are marked with a car icon</li>
              <li>You cannot schedule duplicate rides for the same appointment</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to Patient Selection
        </Button>
      </div>
    </div>
  )
}