export const Card = ({ children, className = '', onClick, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-200 ${
        onClick ? 'cursor-pointer active:scale-98 transition-transform' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}