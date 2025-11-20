import { Clock, Calendar, MapPin, User } from 'lucide-react'
import { StatusBadge } from '../shared/StatusBadge'
import { Card } from '../shared/Card'

export const RideListItem = ({ ride }) => {
  return (
    <Card>
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
    </Card>
  )
}