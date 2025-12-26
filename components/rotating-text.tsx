"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface RotatingTextProps {
  words: string[]
  className?: string
  interval?: number
}

export function RotatingText({ words, className, interval = 2500 }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length)
        setIsAnimating(false)
      }, 300)
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span className="inline-block relative">
      <span
        className={cn(
          "transition-all duration-300 inline-block",
          className,
          isAnimating
            ? "opacity-0 -translate-y-4 scale-95"
            : "opacity-100 translate-y-0 scale-100"
        )}
      >
        {words[currentIndex]}
      </span>
    </span>
  )
}
