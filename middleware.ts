import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Custom middleware for JWT authentication
export function middleware(request: NextRequest) {
  // Allow all API routes to pass through
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow auth pages to pass through
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // For protected routes, check JWT token
  const protectedRoutes = ['/dashboard', '/subscription', '/payment']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Check for JWT token in localStorage (this will be handled client-side)
    // The middleware just allows the request to pass through
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/subscription/:path*', 
    '/payment/:path*'
  ]
}
