import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { noteComments, notes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
 * Comment Request Schema
 * V5 Specification: Threaded comments with position tracking
 */
const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  parentCommentId: z.string().uuid().optional(),
  positionStart: z.number().int().nonnegative().optional(),
  positionEnd: z.number().int().nonnegative().optional(),
}).refine(
  data => {
    // If one position is set, both must be set
    if (data.positionStart !== undefined || data.positionEnd !== undefined) {
      return data.positionStart !== undefined &&
             data.positionEnd !== undefined &&
             data.positionStart <= data.positionEnd;
    }
    return true;
  },
  { message: 'Both positionStart and positionEnd must be set for inline comments' }
);

/**
 * POST /api/notes/:id/comments - Add a comment to a note
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

    // Verify note exists and user has access (view or higher permission)
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // If parent comment exists, verify it belongs to this note
    if (validatedData.parentCommentId) {
      const [parentComment] = await db
        .select()
        .from(noteComments)
        .where(
          and(
            eq(noteComments.id, validatedData.parentCommentId),
            eq(noteComments.noteId, noteId)
          )
        )
        .limit(1);

      if (!parentComment) {
        return errorResponse(
          createError('NOT_FOUND', 'Parent comment not found'),
          request,
          404
        );
      }
    }

    // Create comment
    const result = await db
      .insert(noteComments)
      .values({
        noteId,
        userId,
        content: validatedData.content,
        parentCommentId: validatedData.parentCommentId,
        positionStart: validatedData.positionStart,
        positionEnd: validatedData.positionEnd,
      })
      .returning() as unknown as typeof noteComments.$inferSelect[];

    const comment = result[0];

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'create', 'comment', comment.id, {
          noteId,
          isReply: !!validatedData.parentCommentId,
          isInline: !!(validatedData.positionStart !== undefined),
        })
      );

      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'add_comment');
    }

    return successResponse(comment, request, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Invalid comment data', error.errors),
        request,
        400
      );
    }

    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to create comment: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * GET /api/notes/:id/comments - Get all comments for a note (threaded)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;

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

    // Get all comments for this note, ordered by creation time
    const allComments = await db
      .select()
      .from(noteComments)
      .where(eq(noteComments.noteId, noteId))
      .orderBy(desc(noteComments.createdAt));

    // Organize comments into threads (top-level + replies)
    const topLevelComments = allComments.filter(c => !c.parentCommentId);
    const replies = allComments.filter(c => c.parentCommentId);

    // Build threaded structure
    const threadedComments = topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentCommentId === comment.id),
    }));

    return successResponse(threadedComments, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch comments: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}
