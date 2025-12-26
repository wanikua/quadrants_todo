"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedStats() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 my-32">
      <StatCard number={100} suffix="%" label="Clarity" delay={0} isVisible={isVisible} />
      <StatCard number={4} label="Quadrants" delay={0.2} isVisible={isVisible} />
      <StatCard number={0} label="Learning Curve" delay={0.4} isVisible={isVisible} />
      <StatCard number={1} label="Click to Organize" delay={0.6} isVisible={isVisible} />
    </div>
  )
}

function StatCard({
  number,
  suffix = "",
  label,
  delay,
  isVisible
}: {
  number: number
  suffix?: string
  label: string
  delay: number
  isVisible: boolean
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = number / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= number) {
        setCount(number)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isVisible, number])

  return (
    <div
      className="text-center p-8 rounded-[20px] bg-gradient-to-br from-blue-50 to-purple-50 border-[3px] border-black/10 hover:border-blue-400 transition-all duration-300 hover:scale-105"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
      }}
    >
      <div className="text-5xl md:text-6xl font-bold text-black mb-2">
        {count}{suffix}
      </div>
      <div className="text-lg text-gray-700 font-medium">{label}</div>
    </div>
  )
}
