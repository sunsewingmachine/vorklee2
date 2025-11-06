import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { fileAttachments, linkAttachments } from '@vorklee2/core-attachments';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL_NOTES;

if (!databaseUrl) {
  throw new Error('DATABASE_URL_NOTES environment variable is not set');
}

// Create Neon HTTP client
const sql = neon(databaseUrl);

// Create Drizzle instance with all schemas
export const db = drizzle(sql, { 
  schema: {
    ...schema,
    fileAttachments,
    linkAttachments,
  }
});


