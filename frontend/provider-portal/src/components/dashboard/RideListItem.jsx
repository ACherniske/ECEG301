import { useState, useRef, useEffect } from 'react'
import { Clock, Calendar, MapPin, User, X, Edit2, Check, X as XIcon, ArrowRightLeft } from 'lucide-react'
import { StatusBadge } from '../shared/StatusBadge'
import { Card } from '../shared/Card'

export const RideListItem = ({ ride, onStatusUpdate, onRideUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editValues, setEditValues] = useState({
    pickupTime: ride.pickupTime,
    appointmentTime: ride.appointmentTime,
    providerLocation: ride.providerLocation,
    pickupLocation: ride.pickupLocation,
    notes: ride.notes,
    driverName: ride.driverName,
    driverPlate: ride.driverPlate,
    driverCar: ride.driverCar
  })
  const containerRef = useRef(null)

  // Update editValues when ride prop changes
  useEffect(() => {
    setEditValues({
      pickupTime: ride.pickupTime,
      appointmentTime: ride.appointmentTime,
      providerLocation: ride.providerLocation,
      pickupLocation: ride.pickupLocation,
      notes: ride.notes,
      driverName: ride.driverName,
      driverPlate: ride.driverPlate,
      driverCar: ride.driverCar
    })
  }, [ride])

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
        await onStatusUpdate(ride.id, newStatus, ride.rowIndex)
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

    if (!ride.rowIndex) {
      console.error('Missing rowIndex for ride update')
      return
    }

    setIsUpdating(true)
    try {
      if (onRideUpdate) {
        // Create the update object with the field and rowIndex
        const updates = {
          [field]: editValues[field] || '',
          rowIndex: ride.rowIndex
        }
        
        console.log('Updating ride with:', updates)
        await onRideUpdate(ride.id, updates)
      }
      setEditingField(null)
    } catch (error) {
      console.error('Failed to update field:', error)
      // Revert to original value on error
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

  const EditableField = ({ field, icon: Icon, label, value, type = "text", placeholder }) => {
    const isEditing = editingField === field

    return (
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400 shrink-0" />
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              {type === 'textarea' ? (
                <textarea
                  value={editValues[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <input
                  type={type}
                  value={editValues[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldSave(field)
                }}
                disabled={isUpdating}
                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
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
            <div 
              className="flex items-center gap-2 flex-1 group cursor-text hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleFieldEdit(field)
              }}
            >
              <span className="text-gray-800 flex-1">
                {value || <span className="text-gray-400">{placeholder}</span>}
              </span>
              <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <span className="font-semibold text-gray-800 text-sm">{ride.pickupTime || 'TBD'}</span>
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
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Destination</div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800 text-sm truncate">{ride.providerLocation || 'Not specified'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</div>
                <StatusBadge status={ride.status} />
              </div>
              {ride.roundTrip && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <ArrowRightLeft size={12} />
                  Round Trip
                </div>
              )}
            </div>
          </div>
        ) : (
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
                    <div className="text-xs text-gray-500">ID: {ride.patientId} • Row: {ride.rowIndex}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ride.roundTrip && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    <ArrowRightLeft size={12} />
                    Round Trip
                  </div>
                )}
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
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <EditableField
                field="pickupTime"
                icon={Clock}
                label="Pickup Time"
                value={ride.pickupTime}
                placeholder="TBD"
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
                field="providerLocation"
                icon={MapPin}
                label="Destination"
                value={ride.providerLocation}
                placeholder="Provider location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <EditableField
                field="pickupLocation"
                icon={MapPin}
                label="Pickup Location"
                value={ride.pickupLocation}
                placeholder="Patient address"
              />
              <div className="space-y-2">
                <EditableField
                  field="driverName"
                  icon={User}
                  label="Driver"
                  value={ride.driverName}
                  placeholder="Unassigned"
                />
                {ride.driverName && (
                  <div className="text-xs text-gray-600 ml-6">
                    {ride.driverCar && `${ride.driverCar} • `}
                    {ride.driverPlate || 'No plate info'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <EditableField
                field="notes"
                icon={Edit2}
                label="Notes"
                value={ride.notes}
                placeholder="Special requirements or notes"
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