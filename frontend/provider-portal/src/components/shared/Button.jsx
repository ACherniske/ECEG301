export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon: Icon,
  className = '',
  ...props 
}) => {
  const baseStyles = 'rounded-lg font-medium transition-colors flex items-center gap-2 justify-center'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:bg-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  )
}