import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { trackFeatureUsage } from '@vorklee2/core-analytics';
import { getNotes, createNote } from '@/services/notes.service';
import { createNoteSchema } from '@/lib/validations/notes';

/**
 * GET /api/notes - Get all notes for the organization
 */
export async function GET(request: NextRequest) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;
    
    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Fetch notes
    const notesList = await getNotes(orgId, includeArchived);

    if (!skipAuth) {
      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'list_notes');
    }

    return NextResponse.json({ notes: notesList });
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      { error: `Failed to fetch notes: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes - Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // Create note
    const note = await createNote(validatedData, orgId, userId);

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'create', 'note', note.id, {
          title: note.title,
        })
      );

      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'create_note');
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Create note error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


