import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-to-a-secure-secret-key-at-least-32-characters-long",
)

// Public paths that don't require authentication
const publicPaths = ["/", "/auth/signin", "/auth/signup", "/api/auth"]

// Paths that should always be accessible (even when authenticated)
const alwaysAccessiblePaths = ["/api", "/_next", "/favicon.ico", "/diagnostics"]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path))
}

function isAlwaysAccessible(pathname: string): boolean {
  return alwaysAccessiblePaths.some((path) => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow always accessible paths
  if (isAlwaysAccessible(pathname)) {
    return NextResponse.next()
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  try {
    // Verify JWT token
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    console.error("JWT verification failed:", error)

    // Clear invalid token
    const response = NextResponse.redirect(new URL("/auth/signin", request.url))
    response.cookies.delete("auth-token")
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
