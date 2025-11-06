import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Lazy initialization - only create connection when actually used
// This prevents errors during build time when env vars might not be available
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  // Skip initialization during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a mock that will fail gracefully if accessed during build
    // This should not happen, but provides a safety net
    return null as any;
  }

  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL_CORE;
    
    if (!databaseUrl) {
      // Only throw error at runtime, not during build
      throw new Error('DATABASE_URL_CORE environment variable is not set');
    }

    // Create Neon HTTP client
    const sql = neon(databaseUrl);
    
    // Create Drizzle instance
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}

// Export a getter that initializes on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) {
      throw new Error('Database not initialized. DATABASE_URL_CORE is required.');
    }
    return (instance as any)[prop];
  }
});


