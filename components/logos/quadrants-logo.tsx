import React from 'react'

interface LogoProps {
  size?: number
  className?: string
  variant?: 'v1' | 'v2' | 'v3' | 'v4'
}

// Variant 1: Four Quadrants Grid forming Q
const LogoV1 = ({ size = 40 }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circle */}
    <circle cx="50" cy="50" r="48" fill="#FFD233" stroke="#000000" strokeWidth="4"/>

    {/* Four quadrants - forming Q shape */}
    <rect x="20" y="20" width="22" height="22" fill="#000000" rx="2"/>
    <rect x="58" y="20" width="22" height="22" fill="#000000" rx="2"/>
    <rect x="20" y="58" width="22" height="22" fill="#000000" rx="2"/>

    {/* Q tail - bottom right */}
    <rect x="58" y="58" width="22" height="22" fill="#000000" rx="2" transform="rotate(15 69 69)"/>
  </svg>
)

// Variant 2: Bold Q Letter
const LogoV2 = ({ size = 40 }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Yellow background with black border */}
    <rect x="4" y="4" width="92" height="92" rx="20" fill="#FFD233" stroke="#000000" strokeWidth="4"/>

    {/* Letter Q - outer circle */}
    <circle cx="50" cy="45" r="22" fill="none" stroke="#000000" strokeWidth="8"/>

    {/* Q tail */}
    <rect x="60" y="60" width="8" height="20" fill="#000000" rx="4" transform="rotate(45 64 70)"/>
  </svg>
)

// Variant 3: 4 Squares Grid (Abstract)
const LogoV3 = ({ size = 40 }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Container with border */}
    <rect x="4" y="4" width="92" height="92" rx="16" fill="white" stroke="#000000" strokeWidth="4"/>

    {/* Grid of 4 squares - 2x2 */}
    <rect x="15" y="15" width="30" height="30" fill="#FFD233" stroke="#000000" strokeWidth="3" rx="4"/>
    <rect x="55" y="15" width="30" height="30" fill="#000000" rx="4"/>
    <rect x="15" y="55" width="30" height="30" fill="#000000" rx="4"/>
    <rect x="55" y="55" width="30" height="30" fill="#FFD233" stroke="#000000" strokeWidth="3" rx="4"/>
  </svg>
)

// Variant 4: Minimalist Q with shadow (matches current style)
const LogoV4 = ({ size = 40 }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shadow layer */}
    <rect x="8" y="8" width="84" height="84" rx="18" fill="#000000"/>

    {/* Main yellow background */}
    <rect x="4" y="4" width="84" height="84" rx="18" fill="#FFD233" stroke="#000000" strokeWidth="3"/>

    {/* Bold Q letter */}
    <text
      x="50"
      y="70"
      fontSize="60"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      fill="#000000"
      textAnchor="middle"
    >
      Q
    </text>
  </svg>
)

export const QuadrantsLogo = ({ size = 40, className = '', variant = 'v1' }: LogoProps) => {
  const variants = {
    v1: <LogoV1 size={size} />,
    v2: <LogoV2 size={size} />,
    v3: <LogoV3 size={size} />,
    v4: <LogoV4 size={size} />
  }

  return (
    <div className={className}>
      {variants[variant]}
    </div>
  )
}

// Export individual variants for direct use
export { LogoV1, LogoV2, LogoV3, LogoV4 }
