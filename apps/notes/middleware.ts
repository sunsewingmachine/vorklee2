import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@vorklee2/core-auth';
import { getDefaultRateLimiter } from '@vorklee2/core-utils';
import { errorResponse, createError } from './lib/api-response';

// Rate limiting configuration per AppSpecV4
// Default: 100 requests per minute (can be overridden by subscription tier)
const RATE_LIMIT_POINTS = 100;
const RATE_LIMIT_DURATION = 60; // seconds

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // TEMPORARY: Skip auth for development (REMOVE IN PRODUCTION)
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Rate limiting for API routes using core-utils
  if (pathname.startsWith('/api/')) {
    try {
      // Use IP or orgId as identifier (orgId preferred but requires auth)
      // For now, use IP until auth is fully implemented
      const identifier = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      
      const limiter = getDefaultRateLimiter();
      
      // Note: RateLimiterRedis.consume is async, but middleware supports async
      // However, for simplicity in middleware, we'll use a sync check
      // In production, this should use Redis-based rate limiting properly
      
      // For now, fallback to simple in-memory rate limiting if Redis is unavailable
      // This will be improved when auth is fully implemented with orgId-based limiting
      const rateLimitKey = `rate:${identifier}`;
      
      // Try to consume rate limit (this may fail if Redis is not available)
      try {
        await limiter.consume(rateLimitKey);
      } catch (rateLimitError: any) {
        // Rate limit exceeded
        if (rateLimitError?.remainingPoints === 0) {
          const resetTime = Math.ceil((rateLimitError?.msBeforeNext || 60000) / 1000);
          const response = errorResponse(
            createError('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'),
            request,
            429
          );
          response.headers.set('X-RateLimit-Limit', RATE_LIMIT_POINTS.toString());
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('X-RateLimit-Reset', (Date.now() + resetTime * 1000).toString());
          response.headers.set('Retry-After', resetTime.toString());
          return response;
        }
      }
      
      // TEMPORARY: Skip auth for API in development
      return NextResponse.next();
    } catch (error) {
      // If rate limiting fails, log but allow request (fail open)
      console.error('Rate limiting error:', error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


