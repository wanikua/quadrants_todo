// lib/env.ts

// Centralized, typed environment access and helpers for Clerk and Upstash.
// Note: These functions are used on the server (layouts, middleware, API routes).
// On Vercel, environment variables are injected by environment (Preview/Prod).

type Env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  DATABASE_URL: string
  KV_REST_API_URL?: string
  KV_REST_API_TOKEN?: string
}

export const env: Env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
}

export function isClerkConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY)
}

function normalizeHost(host?: string | null) {
  if (!host) return ""
  // Strip port if present
  return host.replace(/:\d+$/, "").toLowerCase()
}

function isAllowedProdHost(host: string) {
  // Update this list as needed. For production keys we only allow quadrants.ch and its subdomains.
  return host === "quadrants.ch" || host.endsWith(".quadrants.ch")
}

export function isProdClerkKey(): boolean {
  return env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_live_")
}

export function isTestClerkKey(): boolean {
  return env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")
}

/**
 * Returns whether Clerk should be enabled for a given hostname.
 * - If no Clerk keys configured: false
 * - If test key: true on any domain
 * - If prod key: only on allowed hostnames (quadrants.ch and subdomains)
 * - In dev: allow regardless of host if keys exist
 */
export function isClerkEnabledForHost(hostHeader: string | null): boolean {
  if (!isClerkConfigured()) return false

  // Development environment is permissive when keys exist
  if (process.env.NODE_ENV === "development") return true

  const host = normalizeHost(hostHeader)

  if (isTestClerkKey()) return true
  if (isProdClerkKey()) return isAllowedProdHost(host)

  // Unknown key format: disable to be safe
  return false
}

/**
 * Get props for ClerkProvider based on current host.
 * If disabled, return enabled: false and omit props to prevent initialization on disallowed domains.
 */
export function getClerkProviderConfig(hostHeader: string | null): {
  enabled: boolean
  publishableKey?: string
  proxyUrl?: string
  signInUrl?: string
  signUpUrl?: string
} {
  const enabled = isClerkEnabledForHost(hostHeader)

  if (!enabled) {
    return { enabled: false }
  }

  // Ensure we have a valid publishable key
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.warn("Clerk publishable key is missing")
    return { enabled: false }
  }

  return {
    enabled: true,
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    // proxyUrl: process.env.NEXT_PUBLIC_CLERK_PROXY_URL, // uncomment if you have a proxy
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  }
}

/**
 * Upstash KV availability.
 */
export function isKvConfigured(): boolean {
  return Boolean(env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
}
