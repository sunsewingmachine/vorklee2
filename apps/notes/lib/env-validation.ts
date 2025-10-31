import { logger } from '@vorklee2/core-utils';

interface EnvConfig {
  required: string[];
  optional?: Record<string, string>; // key -> default value
}

/**
 * Validate environment variables on startup
 * Per AppSpecV4: All apps must validate required environment variables on startup
 */
export function validateEnvironment(config: EnvConfig): void {
  const missing: string[] = [];

  for (const key of config.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }

  // Set optional defaults
  if (config.optional) {
    for (const [key, defaultValue] of Object.entries(config.optional)) {
      if (!process.env[key]) {
        process.env[key] = defaultValue;
        logger.info(`Set default value for optional environment variable: ${key}`);
      }
    }
  }

  logger.info('Environment validation passed');
}

/**
 * Validate Notes App environment variables
 */
export function validateNotesEnvironment(): void {
  validateEnvironment({
    required: [
      'DATABASE_URL_NOTES',
      'CORE_API_URL',
      'REDIS_URL',
      'NEXT_PUBLIC_APP_URL',
    ],
    optional: {
      'FILE_STORAGE_URL': 'https://cdn.vorklee2.com',
      'VALIDATE_ENV': 'false',
    },
  });
}

