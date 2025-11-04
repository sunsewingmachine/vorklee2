import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { noteVersions, notes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAuth } from '@vorklee2/core-auth';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { trackFeatureUsage } from '@vorklee2/core-analytics';
import {
  successResponse,
  errorResponse,
  createError,
} from '@/lib/api-response';
import { z } from 'zod';

/**
 * Restore Version Request Schema
 */
const restoreVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
});

/**
 * POST /api/notes/:id/restore - Restore a note to a previous version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

    const { id: noteId } = await params;

    // Verify note exists and user has access
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.orgId, orgId)))
      .limit(1);

    if (!note) {
      return errorResponse(
        createError('NOT_FOUND', 'Note not found'),
        request,
        404
      );
    }

    // Only owner or editor can restore versions
    // TODO: Add proper permission checking when roles are implemented
    if (note.userId !== userId) {
      return errorResponse(
        createError('FORBIDDEN', 'Only the note owner can restore versions'),
        request,
        403
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { versionNumber } = restoreVersionSchema.parse(body);

    // Find the version to restore
    const [versionToRestore] = await db
      .select()
      .from(noteVersions)
      .where(
        and(
          eq(noteVersions.noteId, noteId),
          eq(noteVersions.versionNumber, versionNumber)
        )
      )
      .limit(1);

    if (!versionToRestore) {
      return errorResponse(
        createError('NOT_FOUND', `Version ${versionNumber} not found`),
        request,
        404
      );
    }

    // Save current version before restoring
    await db.insert(noteVersions).values({
      noteId,
      versionNumber: note.version ?? 1,
      title: note.title,
      content: note.content ?? '',
      changedBy: note.lastEditedBy,
      changeSummary: `Auto-saved before restoring to version ${versionNumber}`,
    });

    // Restore the note to the selected version
    const newVersionNumber = (note.version ?? 0) + 1;

    const [updatedNote] = await db
      .update(notes)
      .set({
        title: versionToRestore.title,
        content: versionToRestore.content,
        version: newVersionNumber,
        lastEditedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId))
      .returning();

    // Create a new version entry for the restore
    await db.insert(noteVersions).values({
      noteId,
      versionNumber: newVersionNumber,
      title: versionToRestore.title,
      content: versionToRestore.content ?? '',
      changedBy: userId,
      changeSummary: `Restored from version ${versionNumber}`,
    });

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'restore', 'note', noteId, {
          fromVersion: versionNumber,
          toVersion: newVersionNumber,
        })
      );

      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'restore_note_version');
    }

    return successResponse(
      {
        ...updatedNote,
        restoredFrom: versionNumber,
      },
      request,
      200
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Invalid restore data', error.errors),
        request,
        400
      );
    }

    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to restore version: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}
