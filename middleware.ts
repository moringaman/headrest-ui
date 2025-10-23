import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareSupabaseClient(request)
    
    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()
    
    // Check if user is accessing protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        // Redirect to login if accessing protected route without session
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    
    // Check if authenticated user is accessing auth pages
    if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If middleware fails, continue without authentication
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}