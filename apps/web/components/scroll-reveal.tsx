"use client"

import { useEffect, useRef, ReactNode } from "react"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: "fade-in-up" | "slide-up" | "fade-scale" | "scale-in"
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  animation = "fade-in-up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add animation class when element enters viewport
            element.classList.remove("animate-on-scroll")
            element.classList.add(`animate-${animation}`)

            // Optionally unobserve after animation triggers once
            observer.unobserve(element)
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before element enters viewport
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [animation])

  const delayClass = delay > 0 ? `animation-delay-${delay}` : ""

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${delayClass} ${className}`.trim()}
    >
      {children}
    </div>
  )
}
