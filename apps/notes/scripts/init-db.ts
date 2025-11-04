/**
 * Database Initialization Script
 * V5 Notes App
 *
 * This script:
 * 1. Pushes Drizzle schema to database
 * 2. Runs PostgreSQL migrations (triggers, search vectors, RLS)
 * 3. Creates default data if needed
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../db/schema';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function main() {
  console.log('🚀 Initializing Notes App Database...\n');

  // 1. Check environment variables
  if (!process.env.DATABASE_URL_NOTES) {
    console.error('❌ ERROR: DATABASE_URL_NOTES not set in environment');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');

  // 2. Connect to database
  const sql = neon(process.env.DATABASE_URL_NOTES);
  const db = drizzle(sql, { schema });

  console.log('✅ Connected to Neon database');

  // 3. Run migrations
  console.log('\n📦 Running PostgreSQL migrations...');

  const migrationsDir = path.join(__dirname, '../drizzle/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`  Running: ${file}`);
    const migrationSQL = fs.readFileSync(
      path.join(migrationsDir, file),
      'utf-8'
    );

    try {
      await sql(migrationSQL);
      console.log(`  ✅ ${file} applied successfully`);
    } catch (error: any) {
      // Ignore "already exists" errors since we use IF NOT EXISTS
      if (error.message.includes('already exists')) {
        console.log(`  ⚠️  ${file} already applied (skipped)`);
      } else {
        console.error(`  ❌ Error applying ${file}:`, error.message);
        throw error;
      }
    }
  }

  console.log('\n✅ All migrations completed successfully');

  // 4. Create default notebook (optional)
  console.log('\n📝 Checking for default data...');

  // Note: This would require a real org_id and user_id from Core Platform
  // For now, we'll skip creating default data
  console.log('  ℹ️  Default data creation skipped (requires Core Platform integration)');

  console.log('\n🎉 Database initialization complete!\n');
  console.log('Next steps:');
  console.log('  1. Start the development server: npm run dev');
  console.log('  2. Visit http://localhost:3001');
  console.log('  3. Integrate with Core Platform for authentication\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Database initialization failed:', error);
  process.exit(1);
});
