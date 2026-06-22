"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

interface SiteHeaderProps {
  /** Show the Sign In / Get Started (or Dashboard) nav. Hide on auth pages. */
  showNav?: boolean
}

/**
 * Shared marketing/public header — logo + wordmark + auth-aware nav.
 * Mirrors the landing page header so every public surface matches the brand.
 */
export function SiteHeader({ showNav = true }: SiteHeaderProps) {
  const { isSignedIn, isLoaded } = useUser()

  return (
    <header className="relative bg-white/90 backdrop-blur-md z-50 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="group relative flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-black/10">
            <Image
              src="/logo.png"
              alt="Quadrants Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
          </div>
          <span className="text-2xl font-black text-black tracking-tight">Quadrants</span>
        </Link>

        {showNav && (
          <nav className="flex items-center gap-4">
            <Link href="/matrix">
              <Button variant="ghost" className="text-black hover:bg-gray-100 font-bold text-base px-4 h-auto rounded-xl">
                Matrix
              </Button>
            </Link>
            {isLoaded && isSignedIn ? (
              <Link href="/projects">
                <Button className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow font-bold rounded-xl px-6 py-2 h-auto text-base transition-all">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-black hover:bg-gray-100 font-bold text-base px-4 h-auto rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow font-bold rounded-xl px-6 py-2 h-auto text-base transition-all">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
