import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, monitoring } from './monitoring'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later.'
}

// Different rate limits for different endpoints
export const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  },
  
  // Market data - moderate limits
  market: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many market data requests, please slow down.'
  },
  
  // General API - standard limits
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.'
  },
  
  // File uploads - very strict
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many upload attempts, please try again later.'
  },
  
  // Admin operations - moderate
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    message: 'Too many admin requests, please slow down.'
  }
}

export function createRateLimitMiddleware(config: RateLimitConfig = defaultConfig) {
  return async (request: NextRequest) => {
    const ip = getClientIP(request)
    const key = `rate_limit:${ip}:${request.nextUrl.pathname}`
    
    const isAllowed = rateLimiter.isAllowed(
      key,
      config.maxRequests,
      config.windowMs
    )

    if (!isAllowed) {
      // Log rate limit violation
      monitoring.logError(
        `Rate limit exceeded for IP: ${ip}`,
        {
          endpoint: request.nextUrl.pathname,
          severity: 'medium'
        }
      )

      // Record metric
      monitoring.recordMetric('rate_limit_exceeded', 1, {
        endpoint: request.nextUrl.pathname,
        ip
      })

      return NextResponse.json(
        { error: config.message },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
          }
        }
      )
    }

    return null // Allow request to proceed
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

// Middleware wrapper for API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest) => {
    const rateLimitResponse = await createRateLimitMiddleware(config)(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    return handler(request)
  }
}

// Smart rate limiting based on user authentication
export function createSmartRateLimit(
  authenticatedConfig: RateLimitConfig,
  anonymousConfig: RateLimitConfig
) {
  return async (request: NextRequest) => {
    const isAuthenticated = request.headers.get('authorization') || 
                           request.cookies.get('next-auth.session-token')
    
    const config = isAuthenticated ? authenticatedConfig : anonymousConfig
    return createRateLimitMiddleware(config)(request)
  }
}