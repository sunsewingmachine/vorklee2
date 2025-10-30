import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL_CORE;

if (!databaseUrl) {
  throw new Error('DATABASE_URL_CORE environment variable is not set');
}

// Create Neon HTTP client
const sql = neon(databaseUrl);

// Create Drizzle instance
export const db = drizzle(sql, { schema });

