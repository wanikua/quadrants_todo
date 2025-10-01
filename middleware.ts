import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stackServerApp } from './lib/stack-server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/pricing',
    '/handler',
    '/api/stripe/webhook',
  ]

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      // Redirect to sign-in page
      const signInUrl = new URL('/handler/sign-in', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware auth error:', error)
    const signInUrl = new URL('/handler/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
