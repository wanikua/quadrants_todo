"use client"

import Image from "next/image"

export function QuadrantDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top Right - Star & Squiggle */}
      <div className="absolute top-[15%] right-[10%] w-24 h-24 animate-float-gentle transform rotate-6">
        <Image src="/assets/decor_star.png" alt="Star" width={96} height={96} className="object-contain" />
      </div>
      <div className="absolute top-[25%] right-[20%] w-20 h-20 animate-float-gentle" style={{ animationDelay: '1s' }}>
        <Image src="/assets/decor_squiggle.png" alt="Squiggle" width={80} height={80} className="object-contain opacity-60" />
      </div>

      {/* Top Left - Loop & Dots */}
      <div className="absolute top-[20%] left-[12%] w-28 h-28 animate-bounce-gentle transform -rotate-12">
        <Image src="/assets/decor_loop.png" alt="Loop" width={112} height={112} className="object-contain" />
      </div>
      <div className="absolute top-[35%] left-[5%] w-16 h-16 animate-bounce-gentle" style={{ animationDelay: '1.5s' }}>
        <Image src="/assets/decor_dots.png" alt="Dots" width={64} height={64} className="object-contain opacity-50" />
      </div>

      {/* Bottom Right - Arrow & Star */}
      <div className="absolute bottom-[30%] right-[8%] w-32 h-32 animate-wiggle transform rotate-12">
        <Image src="/assets/decor_arrow.png" alt="Arrow" width={128} height={128} className="object-contain opacity-40" />
      </div>
      <div className="absolute bottom-[15%] right-[15%] w-16 h-16 animate-wiggle" style={{ animationDelay: '0.5s' }}>
        <Image src="/assets/decor_star.png" alt="Star" width={64} height={64} className="object-contain opacity-30" />
      </div>

      {/* Bottom Left - Squiggle */}
      <div className="absolute bottom-[20%] left-[10%] w-24 h-24 animate-pulse-slow transform -rotate-6">
        <Image src="/assets/decor_squiggle.png" alt="Squiggle" width={96} height={96} className="object-contain opacity-50" />
      </div>

      {/* Corner Characters - Full Color for Cute Vibe */}

      {/* Sitting Character - Bottom Left */}
      <div className="fixed bottom-0 left-4 w-32 h-32 md:w-48 md:h-48 z-10 pointer-events-none animate-in slide-in-from-bottom duration-1000">
        <Image src="/assets/decor_sitting.png" alt="Sitting Character" width={192} height={192} className="object-contain" />
      </div>

      {/* Peeking Character - Right Edge */}
      <div className="fixed top-1/2 right-0 w-24 h-24 md:w-32 md:h-32 z-10 pointer-events-none transform translate-x-1/3 hover:translate-x-0 transition-transform duration-300">
        <Image src="/assets/decor_peeking.png" alt="Peeking Character" width={128} height={128} className="object-contain -rotate-90" />
      </div>
    </div>
  )
}

export function FloatingTaskCards() {
  // Removed for cleaner editorial style
  return null
}

export function MouseFollowGlow() {
  // Removed for cleaner editorial style
  return null
}
