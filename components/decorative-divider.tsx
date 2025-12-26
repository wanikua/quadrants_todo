"use client"

export function DecorativeDivider() {
  return (
    <div className="w-full flex items-center justify-center my-16 relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-gray-200"></div>
      </div>
      <div className="relative flex items-center gap-4 bg-white px-8">
        <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse-slow"></div>
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" style={{ animationDelay: '0.3s' }}></div>
        <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse-slow" style={{ animationDelay: '0.6s' }}></div>
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" style={{ animationDelay: '0.9s' }}></div>
        <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse-slow" style={{ animationDelay: '1.2s' }}></div>
      </div>
    </div>
  )
}

export function MatrixDivider() {
  return (
    <div className="w-full max-w-xs mx-auto my-20">
      <svg viewBox="0 0 200 200" className="w-full h-auto">
        {/* Quadrant grid */}
        <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="2" className="text-gray-300" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="2" className="text-gray-300" />

        {/* Quadrant labels */}
        <circle cx="150" cy="50" r="8" className="fill-blue-400 animate-pulse-slow" />
        <circle cx="50" cy="50" r="8" className="fill-purple-400 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
        <circle cx="150" cy="150" r="8" className="fill-yellow-400 animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <circle cx="50" cy="150" r="8" className="fill-gray-300 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

        {/* Corner decorations */}
        <rect x="145" y="45" width="10" height="10" rx="2" className="fill-none stroke-blue-400 stroke-2" />
        <rect x="45" y="45" width="10" height="10" rx="2" className="fill-none stroke-purple-400 stroke-2" />
        <rect x="145" y="145" width="10" height="10" rx="2" className="fill-none stroke-yellow-400 stroke-2" />
        <rect x="45" y="145" width="10" height="10" rx="2" className="fill-none stroke-gray-300 stroke-2" />
      </svg>
    </div>
  )
}
