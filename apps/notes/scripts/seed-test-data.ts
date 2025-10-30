import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as schema from '../db/schema';

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL_NOTES;

if (!databaseUrl) {
  throw new Error('DATABASE_URL_NOTES environment variable is not set');
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

// Mock organization and user IDs for development
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000002';

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...\n');

    // Create app user first (required for foreign keys)
    console.log('Creating test app user...');
    const [appUser] = await db
      .insert(schema.appUsers)
      .values({
        id: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        email: 'test@example.com',
        role: 'admin',
      })
      .returning();

    console.log(`✅ App user created: ${appUser.id}\n`);

    // Create a notebook
    console.log('Creating test notebook...');
    const [notebook] = await db
      .insert(schema.notebooks)
      .values({
        organizationId: MOCK_ORG_ID,
        createdBy: MOCK_USER_ID,
        name: 'My First Notebook',
        description: 'A collection of important notes',
        color: '#1976d2',
      })
      .returning();

    console.log(`✅ Notebook created: ${notebook.id}\n`);

    // Create a tag
    console.log('Creating test tag...');
    const [tag] = await db
      .insert(schema.tags)
      .values({
        organizationId: MOCK_ORG_ID,
        name: 'Important',
        color: '#dc004e',
      })
      .returning();

    console.log(`✅ Tag created: ${tag.id}\n`);

    // Create test notes
    console.log('Creating test notes...');
    const notes = await db
      .insert(schema.notes)
      .values([
        {
          organizationId: MOCK_ORG_ID,
          createdBy: MOCK_USER_ID,
          title: 'Welcome to Notes',
          content: 'This is your first note! You can edit, delete, and organize your notes using notebooks and tags.',
          notebookId: notebook.id,
          isPinned: true,
        },
        {
          organizationId: MOCK_ORG_ID,
          createdBy: MOCK_USER_ID,
          title: 'Getting Started Guide',
          content: `# Quick Tips

## Creating Notes
- Click the "New Note" button to create a note
- Use the rich text editor to format your content

## Organization
- Create notebooks to group related notes
- Add tags for easy categorization
- Pin important notes to keep them at the top

## Features
- ✅ Full CRUD operations
- ✅ Notebook organization
- ✅ Tag system
- ✅ Pin important notes
- ✅ Search functionality (coming soon)
- ✅ Attachments support (coming soon)`,
          notebookId: notebook.id,
          isPinned: false,
        },
        {
          organizationId: MOCK_ORG_ID,
          createdBy: MOCK_USER_ID,
          title: 'API Endpoints',
          content: `# Notes API

## Notes
- \`GET /api/notes\` - List all notes
- \`POST /api/notes\` - Create a note
- \`GET /api/notes/[id]\` - Get a note
- \`PATCH /api/notes/[id]\` - Update a note
- \`DELETE /api/notes/[id]\` - Delete a note

## Notebooks
- \`GET /api/notebooks\` - List all notebooks
- \`POST /api/notebooks\` - Create a notebook

## Tags
- \`GET /api/tags\` - List all tags
- \`POST /api/tags\` - Create a tag`,
          notebookId: notebook.id,
          isPinned: false,
        },
      ])
      .returning();

    console.log(`✅ Created ${notes.length} test notes:\n`);
    notes.forEach((note) => {
      console.log(`   - ${note.title}`);
    });

    console.log('\n🎉 Seed complete! Test data has been inserted.\n');
    console.log(`Test with mock org ID: ${MOCK_ORG_ID}`);
    console.log(`Test with mock user ID: ${MOCK_USER_ID}\n`);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();

