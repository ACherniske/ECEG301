export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon: Icon,
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'rounded-xl font-semibold transition-all flex items-center gap-2 justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  )
}