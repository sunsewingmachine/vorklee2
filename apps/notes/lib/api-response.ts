import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * API Response Helpers - Standardized response format per AppSpecV4
 */

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  status?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationLinks {
  self: string | null;
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  retryable: boolean;
}

/**
 * Generate request ID from header or create new one
 */
export function getRequestId(request: Request | null): string {
  if (request) {
    const requestId = request.headers.get('X-Request-ID');
    if (requestId) return requestId;
  }
  return randomUUID();
}

/**
 * Create meta object for responses
 */
export function createMeta(request: Request | null, status?: number): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: getRequestId(request),
    ...(status && { status }),
  };
}

/**
 * Generate HATEOAS pagination links
 */
export function generatePaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  totalPages: number
): PaginationLinks {
  const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  
  return {
    self: `${baseUrl}?${queryParams.toString()}`,
    first: page > 1 ? `${baseUrl}?${new URLSearchParams({ page: '1', limit: limit.toString() }).toString()}` : null,
    last: page < totalPages ? `${baseUrl}?${new URLSearchParams({ page: totalPages.toString(), limit: limit.toString() }).toString()}` : null,
    prev: page > 1 ? `${baseUrl}?${new URLSearchParams({ page: (page - 1).toString(), limit: limit.toString() }).toString()}` : null,
    next: page < totalPages ? `${baseUrl}?${new URLSearchParams({ page: (page + 1).toString(), limit: limit.toString() }).toString()}` : null,
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Success response for single resource
 */
export function successResponse<T>(
  data: T,
  request: Request | null,
  status: number = 200
): NextResponse {
  const meta = createMeta(request, status);
  const response = NextResponse.json({ data, meta }, { status });
  
  // Add request ID to headers
  response.headers.set('X-Request-ID', meta.requestId);
  
  return response;
}

/**
 * Success response for list with pagination
 */
export function successListResponse<T>(
  data: T[],
  request: Request | null,
  pagination: PaginationMeta,
  links?: PaginationLinks,
  status: number = 200
): NextResponse {
  const meta = createMeta(request, status);
  const response = NextResponse.json(
    {
      data,
      pagination,
      ...(links && { links }),
      meta,
    },
    { status }
  );
  
  // Add request ID to headers
  response.headers.set('X-Request-ID', meta.requestId);
  
  return response;
}

/**
 * Error response
 */
export function errorResponse(
  error: ApiError,
  request: Request | null,
  status: number = 400
): NextResponse {
  const meta = createMeta(request, status);
  const response = NextResponse.json(
    {
      error: {
        ...error,
        code: error.code || 'INTERNAL_ERROR',
        retryable: error.retryable ?? false,
      },
      meta,
    },
    { status }
  );
  
  // Add request ID to headers
  response.headers.set('X-Request-ID', meta.requestId);
  
  return response;
}

/**
 * Standard error codes mapping
 */
export const ErrorCodes = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', retryable: false },
  AUTH_FAILED: { code: 'AUTH_FAILED', retryable: false },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', retryable: false },
  INSUFFICIENT_PERMISSIONS: { code: 'INSUFFICIENT_PERMISSIONS', retryable: false },
  FORBIDDEN: { code: 'FORBIDDEN', retryable: false },
  SUBSCRIPTION_REQUIRED: { code: 'SUBSCRIPTION_REQUIRED', retryable: false },
  NOT_FOUND: { code: 'NOT_FOUND', retryable: false },
  CONFLICT: { code: 'CONFLICT', retryable: false },
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', retryable: true },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', retryable: true },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', retryable: true },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', retryable: true },
} as const;

/**
 * Helper to create error from standard codes
 */
export function createError(
  code: keyof typeof ErrorCodes,
  message: string,
  details?: Record<string, any>
): ApiError {
  return {
    message,
    code: ErrorCodes[code].code,
    retryable: ErrorCodes[code].retryable,
    ...(details && { details }),
  };
}

