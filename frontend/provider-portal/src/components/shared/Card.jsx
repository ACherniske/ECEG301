export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}