import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

// Redis client singleton
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    redisClient = new Redis(redisUrl);
  }
  return redisClient;
}

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

// Rate limiter factory
export interface RateLimiterConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds if limit exceeded
}

export function createRateLimiter(config: RateLimiterConfig) {
  const redis = getRedisClient();
  
  return new RateLimiterRedis({
    storeClient: redis,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  });
}

// Default rate limiter (100 requests per minute)
export const defaultRateLimiter = createRateLimiter({
  points: 100,
  duration: 60,
});

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

