import { Clock, Check, User, Route, Car, Navigation, X } from 'lucide-react'

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      styles: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      icon: Clock,
      label: 'Pending'
    },
    confirmed: {
      styles: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      icon: Check,
      label: 'Confirmed'
    },
    claimed: {
      styles: 'bg-green-100 text-green-800 border border-green-300',
      icon: User,
      label: 'Claimed'
    },
    'en route': {
      styles: 'bg-green-100 text-green-800 border border-green-300',
      icon: Route,
      label: 'En Route'
    },
    'in transit': {
      styles: 'bg-green-100 text-green-800 border border-green-300',
      icon: Car,
      label: 'In Transit'
    },
    arrived: {
      styles: 'bg-green-100 text-green-800 border border-green-300',
      icon: Navigation,
      label: 'Arrived'
    },
    completed: {
      styles: 'bg-blue-100 text-blue-800 border border-blue-300',
      icon: Check,
      label: 'Completed'
    },
    cancelled: {
      styles: 'bg-red-100 text-red-800 border border-red-300',
      icon: X,
      label: 'Cancelled'
    }
  }

  // Get config for the current status, fallback to pending if not found
  const config = statusConfig[status] || statusConfig.pending
  const IconComponent = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.styles}`}>
      <IconComponent size={12} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}