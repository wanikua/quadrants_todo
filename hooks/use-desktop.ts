'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to detect if running inside the Tauri desktop app
 * and listen for native events (shortcuts, menu items)
 */
export function useDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Check for Tauri desktop flag injected by main.rs
    const check = () => {
      setIsDesktop(
        typeof window !== 'undefined' &&
        ((window as any).__QUADRANTS_DESKTOP__ === true ||
         (window as any).__TAURI_INTERNALS__ !== undefined)
      )
    }
    check()
    // Re-check after a short delay (flag may be injected async)
    const timer = setTimeout(check, 500)
    return () => clearTimeout(timer)
  }, [])

  return { isDesktop }
}

/**
 * Hook to listen for Tauri custom events dispatched from native shortcuts/menus
 */
export function useTauriEvent(eventName: string, handler: () => void) {
  useEffect(() => {
    const listener = () => handler()
    document.addEventListener(eventName, listener)
    return () => document.removeEventListener(eventName, listener)
  }, [eventName, handler])
}

/**
 * Desktop-aware layout padding for overlay title bar
 * Returns extra top padding when running in Tauri with overlay titlebar
 */
export function useDesktopPadding() {
  const { isDesktop } = useDesktop()
  return {
    paddingTop: isDesktop ? '28px' : '0px',
    // Drag region for the title bar area
    titleBarClass: isDesktop ? 'tauri-drag-region' : '',
  }
}
