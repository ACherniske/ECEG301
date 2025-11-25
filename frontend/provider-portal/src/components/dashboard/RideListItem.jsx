import { useState, useRef, useEffect } from 'react'
import { Clock, Calendar, MapPin, User, X, Edit2, Check, X as XIcon } from 'lucide-react'
import { StatusBadge } from '../shared/StatusBadge'
import { Card } from '../shared/Card'

export const RideListItem = ({ ride, onStatusUpdate, onRideUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editValues, setEditValues] = useState({
    pickupTime: ride.pickupTime,
    appointmentTime: ride.appointmentTime,
    location: ride.location
  })
  const containerRef = useRef(null)

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'green' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsExpanded(false)
        setEditingField(null)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ride.status) {
      setIsExpanded(false)
      return
    }

    setIsUpdating(true)
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(ride.id, newStatus)
      }
      setIsExpanded(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFieldEdit = (field) => {
    setEditingField(field)
  }

  const handleFieldSave = async (field) => {
    if (editValues[field] === ride[field]) {
      setEditingField(null)
      return
    }

    setIsUpdating(true)
    try {
      if (onRideUpdate) {
        const updatedRide = { ...ride, [field]: editValues[field] }
        await onRideUpdate(ride.id, updatedRide)
      }
      setEditingField(null)
    } catch (error) {
      console.error('Failed to update field:', error)
      // Reset to original value on error
      setEditValues(prev => ({ ...prev, [field]: ride[field] }))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFieldCancel = (field) => {
    setEditValues(prev => ({ ...prev, [field]: ride[field] }))
    setEditingField(null)
  }

  const handleInputChange = (field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }))
  }

  const handleCardClick = () => {
    setIsExpanded(!isExpanded)
  }

  const EditableField = ({ field, icon: Icon, label, value, type = "text" }) => {
    const isEditing = editingField === field

    return (
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400 shrink-0" />
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type={type}
                value={editValues[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-800 focus:outline-none focus:border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldSave(field)
                }}
                disabled={isUpdating}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldCancel(field)
                }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <XIcon size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 group">
              <span className="font-semibold text-gray-800 flex-1">{value}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldEdit(field)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <Card 
        className={`transition-all cursor-pointer ${isExpanded ? 'border-blue-400 shadow-md' : 'hover:shadow-sm'}`}
        onClick={handleCardClick}
      >
        {!isExpanded ? (
          // Collapsed view
          <div className="grid grid-cols-5 gap-4 items-center">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={16} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{ride.patientName}</div>
                  <div className="text-xs text-gray-500">{ride.patientId}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pickup Time</div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800 text-sm">{ride.pickupTime}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Appointment</div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800 text-sm">{ride.appointmentTime}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800 text-sm truncate">{ride.location}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</div>
              <StatusBadge status={ride.status} />
            </div>
          </div>
        ) : (
          // Expanded view with editing capabilities
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{ride.patientName}</div>
                    <div className="text-xs text-gray-500">{ride.patientId}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(false)
                  setEditingField(null)
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <EditableField
                field="pickupTime"
                icon={Clock}
                label="Pickup Time"
                value={ride.pickupTime}
                type="time"
              />
              <EditableField
                field="appointmentTime"
                icon={Calendar}
                label="Appointment"
                value={ride.appointmentTime}
                type="time"
              />
              <EditableField
                field="location"
                icon={MapPin}
                label="Location"
                value={ride.location}
                type="text"
              />
            </div>

            <div className="border-t pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</div>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(option.value)
                    }}
                    disabled={isUpdating || option.value === ride.status}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      option.value === ride.status
                        ? 'bg-gray-100 text-gray-600 cursor-default opacity-60'
                        : isUpdating
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}