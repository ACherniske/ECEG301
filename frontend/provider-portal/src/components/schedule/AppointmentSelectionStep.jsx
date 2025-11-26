import { useState, useEffect } from 'react'
import { Calendar, AlertCircle, Loader, Clock, MapPin, User, Check } from 'lucide-react'
import { Button } from '../shared/Button'
import { ehrService } from '../../services/ehrService'

export const AppointmentSelectionStep = ({ organizationId, patient, onAppointmentSelected, onLoading }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      onLoading(true)

      try {
        const data = await ehrService.getPatientAppointments(organizationId, patient.id)
        setAppointments(data)

        if (data.length === 0) {
          setError('No upcoming appointments found for this patient')
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch appointments')
      } finally {
        setLoading(false)
        onLoading(false)
      }
    }

    fetchAppointments()
  }, [patient, organizationId])

  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    onAppointmentSelected(appointment)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</span>
          Select Appointment
        </h3>
      </div>

      {loading && (
        <div className="text-center py-8">
          <Loader size={24} className="animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <button
              key={apt.id}
              onClick={() => handleSelectAppointment(apt)}
              className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                selectedAppointment?.id === apt.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <div className="font-medium text-gray-900">{apt.appointmentType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <div className="text-sm text-gray-600">
                      {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    <div className="text-sm text-gray-600">
                      {apt.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    <div className="text-sm text-gray-500">
                      {apt.providerName}
                    </div>
                  </div>
                </div>
                {selectedAppointment?.id === apt.id && (
                  <div className="flex items-center gap-1 text-blue-600 font-semibold">
                    <Check size={16} />
                    Selected
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}