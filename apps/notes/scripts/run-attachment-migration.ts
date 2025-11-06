import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const databaseUrl = process.env.DATABASE_URL_NOTES;

if (!databaseUrl) {
  console.error('DATABASE_URL_NOTES environment variable is not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration() {
  try {
    const migrationPath = path.resolve(__dirname, '../drizzle/migrations/003_add_attachments_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration: 003_add_attachments_tables.sql');
    
    // Split SQL into statements - handle multi-line statements properly
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => {
        // Filter out comments and empty statements
        const cleaned = s.replace(/--.*$/gm, '').trim();
        return cleaned.length > 0 && !cleaned.match(/^\/\*/);
      });
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        // Remove trailing semicolons if present
        const cleanStatement = statement.replace(/;$/, '') + ';';
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await sql(cleanStatement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

runMigration();

