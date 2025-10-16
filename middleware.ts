import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simplified rate limiting for serverless (memory-based, per-instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const MAX_MAP_SIZE = 1000

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  const now = Date.now()
  const key = ip
  const record = rateLimitMap.get(key)
  
  // Clean up old entries to prevent memory leaks
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const cutoff = now - windowMs
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < cutoff) {
        rateLimitMap.delete(k)
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         req.ip || 'unknown'
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    const isAdminPath = pathname.startsWith('/admin')
    const isEducationAdminPath = pathname.startsWith('/admin/education')
    const isAPIPath = pathname.startsWith('/api/')
    
    // Apply rate limiting to API routes (disabled in development)
    if (isAPIPath && process.env.NODE_ENV === 'production') {
      const ip = getClientIP(req as NextRequest)
      let limit = 100
      let windowMs = 15 * 60 * 1000 // 15 minutes
      
      if (pathname.startsWith('/api/auth')) {
        limit = 5
        windowMs = 15 * 60 * 1000
      } else if (pathname.startsWith('/api/market') || pathname.startsWith('/api/rates')) {
        limit = 60
        windowMs = 60 * 1000 // 1 minute
      } else if (pathname.startsWith('/api/upload')) {
        limit = 10
        windowMs = 60 * 60 * 1000 // 1 hour
      } else if (pathname.startsWith('/api/admin')) {
        limit = 200
        windowMs = 5 * 60 * 1000 // 5 minutes
      }
      
      if (!checkRateLimit(ip, limit, windowMs)) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
    }
    
    // Add comprehensive security headers
    const response = NextResponse.next()
    
    // Basic security headers only
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Remove restrictive headers that block iframes
    response.headers.delete('X-Frame-Options')
    response.headers.delete('Content-Security-Policy')
    
    // Content Security Policy for uploads only
    if (pathname.startsWith('/uploads/')) {
      response.headers.set('Content-Disposition', 'attachment')
    }
    
    // Protect admin routes
    if (isAdminPath && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    // Ensure admin has full access to education management
    if (isEducationAdminPath && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminPath = req.nextUrl.pathname.startsWith('/admin')
        
        // Allow access to non-admin paths
        if (!isAdminPath) return true
        
        // Require admin role for admin paths
        return token?.role === 'ADMIN'
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}