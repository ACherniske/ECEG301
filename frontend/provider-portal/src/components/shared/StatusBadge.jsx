export const StatusBadge = ({ status }) => {
  const statusStyles = {
    confirmed: 'bg-green-100 text-green-700 border border-green-300',
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    completed: 'bg-blue-100 text-blue-700 border border-blue-300',
    cancelled: 'bg-red-100 text-red-700 border border-red-300',
  }

  const displayText = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || statusStyles.pending}`}>
      {displayText}
    </span>
  )
}