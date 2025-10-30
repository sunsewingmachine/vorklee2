import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

const databaseUrl = process.env.DATABASE_URL_CORE;

if (!databaseUrl) {
  throw new Error('DATABASE_URL_CORE environment variable is not set');
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function seedNotesApp() {
  try {
    console.log('Seeding Notes app...');

    // Check if Notes app already exists
    const existingApps = await db.select().from(schema.apps).where(eq(schema.apps.code, 'notes'));
    
    if (existingApps.length > 0) {
      console.log('Notes app already exists!');
      return;
    }

    // Insert Notes app
    const [notesApp] = await db
      .insert(schema.apps)
      .values({
        code: 'notes',
        name: 'Notes App',
        description: 'Collaborative note-taking for teams',
      })
      .returning();

    console.log('Notes app created:', notesApp);
  } catch (error) {
    console.error('Error seeding Notes app:', error);
    throw error;
  }
}

seedNotesApp()
  .then(() => {
    console.log('Seed complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

