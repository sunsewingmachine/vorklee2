import { NextRequest } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { getNoteById, updateNote, deleteNote } from '@/services/notes.service';
import { updateNoteSchema } from '@/lib/validations/notes';
import { successResponse, errorResponse, createError } from '@/lib/api-response';

/**
 * GET /api/notes/[id] - Get a single note
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const { id } = await context.params;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Fetch note
    const note = await getNoteById(id, orgId);

    if (!note) {
      return errorResponse(createError('NOT_FOUND', 'Note not found'), request, 404);
    }

    return successResponse(note, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch note: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
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
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;
    const { id } = await context.params;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Update note
    const note = await updateNote(id, validatedData, orgId);

    if (!note) {
      return errorResponse(createError('NOT_FOUND', 'Note not found'), request, 404);
    }

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'update', 'note', note.id, {
          changes: validatedData,
        })
      );
    }

    return successResponse(note, request);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Validation failed', { message: error.message }),
        request,
        400
      );
    }

    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
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
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;
    const { id } = await context.params;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Delete note (soft delete)
    const note = await deleteNote(id, orgId);

    if (!note) {
      return errorResponse(createError('NOT_FOUND', 'Note not found'), request, 404);
    }

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'delete', 'note', note.id)
      );
    }

    return successResponse({ id: note.id, message: 'Note deleted successfully' }, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}


