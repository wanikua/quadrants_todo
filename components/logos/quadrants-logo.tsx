import React from 'react'

interface LogoProps {
  size?: number
  className?: string
  variant?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5'
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

// Variant 5: Dot-grid "Q" — a continuous rounded ribbon traced through a grid of
// outlined circles (reference numeral style). Octagonal "O" bowl + a tail that
// crosses the lower-right ring and pokes outward, reading unmistakably as a Q.
const LogoV5 = ({ size = 40 }: { size: number }) => {
  const COLS = 5
  const ROWS = 5
  const PAD = 16
  const step = (100 - PAD * 2) / (Math.max(COLS, ROWS) - 1) // grid spacing = 17
  const ox = (100 - (COLS - 1) * step) / 2
  const oy = (100 - (ROWS - 1) * step) / 2
  const X = (c: number) => ox + c * step
  const Y = (r: number) => oy + r * step
  const R = step * 0.56 // circle radius (slight overlap → bulgy blob)
  const W = step * 1.06 // ribbon width so linked cells merge into one shape

  // Octagonal bowl (the "O") + crossing tail (the "Q" stroke).
  const on: Array<[number, number]> = [
    [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3], [1, 4], [2, 4], [3, 4],
    [2, 2], [3, 3], [4, 4],
  ]
  const links: Array<[[number, number], [number, number]]> = [
    [[1, 0], [2, 0]], [[2, 0], [3, 0]],
    [[1, 0], [0, 1]], [[3, 0], [4, 1]],
    [[0, 1], [0, 2]], [[0, 2], [0, 3]],
    [[4, 1], [4, 2]], [[4, 2], [4, 3]],
    [[0, 3], [1, 4]], [[4, 3], [3, 4]],
    [[1, 4], [2, 4]], [[2, 4], [3, 4]],
    [[2, 2], [3, 3]], [[3, 3], [4, 4]],
  ]
  const grid: Array<[number, number]> = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid.push([c, r])

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* faint construction grid */}
      {grid.map(([c, r], i) => (
        <circle key={`g${i}`} cx={X(c)} cy={Y(r)} r={R} fill="none" stroke="#d4d4d8" strokeWidth="1.3" />
      ))}
      {/* blob connectors */}
      {links.map(([[ac, ar], [bc, br]], i) => (
        <line key={`l${i}`} x1={X(ac)} y1={Y(ar)} x2={X(bc)} y2={Y(br)} stroke="#000000" strokeWidth={W} strokeLinecap="round" />
      ))}
      {/* filled cells */}
      {on.map(([c, r], i) => (
        <circle key={`o${i}`} cx={X(c)} cy={Y(r)} r={R} fill="#000000" />
      ))}
    </svg>
  )
}

export const QuadrantsLogo = ({ size = 40, className = '', variant = 'v1' }: LogoProps) => {
  const variants = {
    v1: <LogoV1 size={size} />,
    v2: <LogoV2 size={size} />,
    v3: <LogoV3 size={size} />,
    v4: <LogoV4 size={size} />,
    v5: <LogoV5 size={size} />
  }

  return (
    <div className={className}>
      {variants[variant]}
    </div>
  )
}

// Export individual variants for direct use
export { LogoV1, LogoV2, LogoV3, LogoV4, LogoV5 }
