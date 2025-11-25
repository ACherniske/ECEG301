export const NotificationOverlay = ({ error, success }) => {
  if (!error && !success) return null

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 shadow-lg mb-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 shadow-lg mb-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            {success}
          </div>
        </div>
      )}
    </div>
  )
}