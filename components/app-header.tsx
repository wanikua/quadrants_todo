"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useDesktop } from "@/hooks/use-desktop"

interface AppHeaderProps {
  /** Where the logo/wordmark links to. Defaults to the app home (/projects). */
  homeHref?: string
  /** Dense full-screen views (project detail, local) use a shorter bar. */
  compact?: boolean
  /** Content rendered right after the wordmark — breadcrumbs, titles, badges. */
  left?: React.ReactNode
  /** Right-aligned actions — buttons, toggles, status indicators. */
  children?: React.ReactNode
}

/**
 * Shared app-shell header. One consistent treatment across every signed-in
 * surface (projects, dashboard, project detail, local): logo + "Quadrants"
 * wordmark + a page-specific actions slot, on the brand's bold black underline.
 * `compact` trims the bar for dense full-screen views.
 */
export function AppHeader({ homeHref = "/projects", compact = false, left, children }: AppHeaderProps) {
  const { isDesktop } = useDesktop()
  const logo = compact ? 32 : 40

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-3 border-black ${isDesktop ? "tauri-drag-region" : ""}`}
      style={isDesktop ? { paddingTop: "28px" } : undefined}
    >
      <div
        className={`w-full max-w-7xl mx-auto flex items-center justify-between gap-3 ${
          compact ? "px-4 h-14" : "px-6 h-20"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href={homeHref} className="group relative flex items-center gap-2.5 shrink-0">
            <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-black/10">
              <Image
                src="/logo.png"
                alt="Quadrants"
                width={logo}
                height={logo}
                className="object-contain rounded-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                style={{ width: logo, height: logo }}
              />
            </div>
            <span className={`font-black text-black tracking-tight ${compact ? "text-lg hidden sm:inline" : "text-2xl"}`}>
              Quadrants
            </span>
          </Link>
          {left && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-black/20 font-black select-none">/</span>
              {left}
            </div>
          )}
        </div>

        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </header>
  )
}
