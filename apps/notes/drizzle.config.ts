import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file with absolute path
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_NOTES || '',
  },
});


