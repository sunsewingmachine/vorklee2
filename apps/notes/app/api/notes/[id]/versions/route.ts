import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { noteVersions, notes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserAuth } from '@vorklee2/core-auth';
import { recordAudit, createAuditEvent } from '@/core-audit';
import {
  successListResponse,
  successResponse,
  errorResponse,
  createError,
} from '@/lib/api-response';

/**
 * GET /api/notes/:id/versions - Get version history for a note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;

    const noteId = params.id;

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    // Get version history, ordered by version number descending
    const versions = await db
      .select()
      .from(noteVersions)
      .where(eq(noteVersions.noteId, noteId))
      .orderBy(desc(noteVersions.versionNumber))
      .limit(limit);

    // Add current version to the list (if not already there)
    const currentVersion = {
      id: note.id,
      noteId: note.id,
      versionNumber: note.version,
      title: note.title,
      content: note.content,
      changedBy: note.lastEditedBy,
      changeSummary: 'Current version',
      createdAt: note.updatedAt,
    };

    // Check if current version is already in history
    const hasCurrentVersion = versions.some(v => v.versionNumber === note.version);

    const allVersions = hasCurrentVersion
      ? versions
      : [currentVersion, ...versions];

    return successListResponse(allVersions, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch version history: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}
