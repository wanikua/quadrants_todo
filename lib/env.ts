export const env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
}

export const isClerkConfigured = () => {
  return !!(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY)
}

// Check if we should use Clerk based on domain and environment
export const shouldUseClerk = () => {
  // Don't use Clerk if not configured
  if (!isClerkConfigured()) {
    return false
  }
  
  // For production keys, only allow on the configured domain
  if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      // Only allow on quadrants.ch domain for production keys
      return hostname === 'quadrants.ch' || hostname.endsWith('.quadrants.ch')
    }
    // Server-side: assume production domain
    return true
  }
  
  // For test keys, allow on any domain
  if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_')) {
    return true
  }
  
  // In development, always use Clerk if configured
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}
