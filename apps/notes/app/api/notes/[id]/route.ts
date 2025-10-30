import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { getNoteById, updateNote, deleteNote } from '@/services/notes.service';
import { updateNoteSchema } from '@/lib/validations/notes';

/**
 * GET /api/notes/[id] - Get a single note
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserAuth();
    const { id } = await context.params;

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Fetch note
    const note = await getNoteById(id, orgId);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json(
      { error: `Failed to fetch note: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notes/[id] - Update a note
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserAuth();
    const { id } = await context.params;

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Update note
    const note = await updateNote(id, validatedData, orgId);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Record audit event
    await recordAudit(
      createAuditEvent(orgId, userId, 'update', 'note', note.id, {
        changes: validatedData,
      })
    );

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Update note error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id] - Delete (archive) a note
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserAuth();
    const { id } = await context.params;

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Delete note (soft delete)
    const note = await deleteNote(id, orgId);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Record audit event
    await recordAudit(
      createAuditEvent(orgId, userId, 'delete', 'note', note.id)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: `Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


