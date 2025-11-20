export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}