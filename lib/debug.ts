/**
 * Debug utility for conditional logging
 * In production, these logs are stripped out for better performance
 */

const isDev = process.env.NODE_ENV === 'development'

export const debug = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },

  error: (...args: any[]) => {
    // Always log errors, but with better formatting in dev
    if (isDev) {
      console.error(...args)
    } else {
      // In production, only log the essential error info
      console.error('[Error]', args[0])
    }
  },

  warn: (...args: any[]) => {
    if (isDev) console.warn(...args)
  },

  info: (...args: any[]) => {
    if (isDev) console.info(...args)
  },

  // Special debug for sync operations
  sync: (...args: any[]) => {
    if (isDev) console.log('🔄 [Sync]', ...args)
  },

  // Performance measurement
  time: (label: string) => {
    if (isDev) console.time(label)
  },

  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(label)
  }
}

/**
 * Measure async function performance
 */
export async function measurePerf<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isDev) return fn()

  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start

    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`)
    } else {
      console.log(`✅ ${label}: ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`❌ ${label} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * Type-safe logger for specific contexts
 */
export const logger = {
  api: (method: string, path: string, ...args: any[]) => {
    debug.log(`🌐 [API] ${method} ${path}`, ...args)
  },

  db: (operation: string, ...args: any[]) => {
    debug.log(`💾 [DB] ${operation}`, ...args)
  },

  sync: (action: string, ...args: any[]) => {
    debug.sync(action, ...args)
  },

  component: (name: string, ...args: any[]) => {
    debug.log(`⚛️ [${name}]`, ...args)
  }
}
