import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve('.env.local') });

const databaseUrl = process.env.DATABASE_URL_NOTES;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL_NOTES is not set!');
  process.exit(1);
}

console.log('✓ DATABASE_URL_NOTES loaded');

const sql = neon(databaseUrl);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();

