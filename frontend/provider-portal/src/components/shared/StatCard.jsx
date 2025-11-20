export const StatCard = ({ label, value, bgColor, textColor }) => {
  return (
    <div className={`${bgColor} p-6 rounded-lg border-2 border-opacity-30`}>
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className={`text-4xl font-bold ${textColor}`}>{value}</div>
    </div>
  )
}