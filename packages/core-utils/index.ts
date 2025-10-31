import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

// Logger utility
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : error);
  },
};

// Redis client singleton
let redisClient: Redis | null = null;
let useMockRedis = false;

export function isUsingMockRedis(): boolean {
  return useMockRedis;
}

export function getRedisClient(): Redis {
  if (useMockRedis) {
    // Return mock client immediately
    return {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      del: async () => 0,
      keys: async () => [],
    } as any;
  }

  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      // In development, return a mock client instead of throwing
      logger.warn('REDIS_URL not set, using mock Redis client');
      useMockRedis = true;
      return {
        get: async () => null,
        set: async () => 'OK',
        setex: async () => 'OK',
        del: async () => 0,
        keys: async () => [],
      } as any;
    }

    // Configure Redis with fast fail settings for development
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1, // Only retry once
      connectTimeout: 1000, // 1 second timeout
      retryStrategy(times) {
        if (times > 3) {
          // Switch to mock after 3 failed attempts
          logger.warn('Redis connection failed, switching to mock client');
          useMockRedis = true;
          return null; // Stop retrying
        }
        return Math.min(times * 50, 500); // Max 500ms between retries
      },
      lazyConnect: true, // Don't connect immediately
    });

    // Try to connect, but use mock if it fails
    redisClient.connect().catch((err) => {
      logger.warn('Redis connection failed, using mock client', err.message);
      useMockRedis = true;
      redisClient = null;
    });
  }
  return redisClient;
}

// Rate limiter factory
export interface RateLimiterConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds if limit exceeded
}

export function createRateLimiter(config: RateLimiterConfig) {
  try {
    const redis = getRedisClient();

    // If using mock Redis, return a no-op limiter
    if (isUsingMockRedis()) {
      logger.warn('Using mock Redis, rate limiter disabled');
      return {
        consume: async () => ({ remainingPoints: config.points }),
        delete: async () => {},
        reset: async () => {},
      } as any;
    }

    return new RateLimiterRedis({
      storeClient: redis,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });
  } catch (error) {
    // Return a no-op limiter if Redis is not available
    logger.warn('Redis not available, rate limiter disabled');
    return {
      consume: async () => ({ remainingPoints: config.points }),
      delete: async () => {},
      reset: async () => {},
    } as any;
  }
}

// Default rate limiter (100 requests per minute) - lazy loaded
let _defaultRateLimiter: any = null;
export function getDefaultRateLimiter() {
  if (!_defaultRateLimiter) {
    _defaultRateLimiter = createRateLimiter({
      points: 100,
      duration: 60,
    });
  }
  return _defaultRateLimiter;
}

// Helper to format dates
export function formatDate(date: Date): string {
  return date.toISOString();
}

// Helper to parse environment variables
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
}

// Helper to validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Cache helper functions
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const redis = getRedisClient();
    const stringValue = JSON.stringify(value);
    
    if (options.ttl) {
      await redis.setex(key, options.ttl, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
  } catch (error) {
    logger.error('Cache set error', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    logger.error('Cache delete error', error);
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Cache delete pattern error', error);
  }
}


