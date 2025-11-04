import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { noteShares, notes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAuth } from '@vorklee2/core-auth';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { trackFeatureUsage } from '@vorklee2/core-analytics';
import {
  successResponse,
  successListResponse,
  errorResponse,
  createError,
} from '@/lib/api-response';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * Share Request Schema
 * V5 Specification: Support for user, org, and public link sharing
 */
const shareNoteSchema = z.object({
  sharedWithUserId: z.string().uuid().optional(),
  sharedWithOrgId: z.string().uuid().optional(),
  isPublicLink: z.boolean().optional(),
  permission: z.enum(['view', 'comment', 'edit']),
  expiresInDays: z.number().positive().max(365).optional(),
}).refine(
  data => data.sharedWithUserId || data.sharedWithOrgId || data.isPublicLink,
  { message: 'Must specify sharedWithUserId, sharedWithOrgId, or isPublicLink' }
);

/**
 * POST /api/notes/:id/share - Share a note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

    const noteId = params.id;

    // Verify note exists and user has permission
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

    // Only owner can share (in future, add role-based permissions)
    if (note.userId !== userId) {
      return errorResponse(
        createError('FORBIDDEN', 'Only the note owner can share this note'),
        request,
        403
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = shareNoteSchema.parse(body);

    // Generate public link token if needed
    let publicLinkToken: string | undefined;
    let publicLinkExpiresAt: Date | undefined;

    if (validatedData.isPublicLink) {
      publicLinkToken = crypto.randomBytes(32).toString('hex');
      if (validatedData.expiresInDays) {
        publicLinkExpiresAt = new Date();
        publicLinkExpiresAt.setDate(publicLinkExpiresAt.getDate() + validatedData.expiresInDays);
      }
    }

    // Create share
    const [share] = await db
      .insert(noteShares)
      .values({
        noteId,
        sharedBy: userId,
        sharedWithUserId: validatedData.sharedWithUserId,
        sharedWithOrgId: validatedData.sharedWithOrgId,
        permission: validatedData.permission,
        isPublicLink: validatedData.isPublicLink || false,
        publicLinkToken,
        publicLinkExpiresAt,
      })
      .returning();

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'share', 'note', noteId, {
          shareId: share.id,
          permission: share.permission,
          isPublicLink: share.isPublicLink,
        })
      );

      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'share_note');
    }

    // Return share with public URL if applicable
    const responseData = {
      ...share,
      publicUrl: share.isPublicLink && share.publicLinkToken
        ? `${process.env.NEXT_PUBLIC_APP_URL}/s/${share.publicLinkToken}`
        : undefined,
    };

    return successResponse(responseData, request, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Invalid share data', error.errors),
        request,
        400
      );
    }

    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to share note: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * GET /api/notes/:id/share - List all shares for a note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

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

    // Get all shares for this note
    const shares = await db
      .select()
      .from(noteShares)
      .where(eq(noteShares.noteId, noteId));

    // Add public URLs for public link shares
    const sharesWithUrls = shares.map(share => ({
      ...share,
      publicUrl: share.isPublicLink && share.publicLinkToken
        ? `${process.env.NEXT_PUBLIC_APP_URL}/s/${share.publicLinkToken}`
        : undefined,
    }));

    return successListResponse(sharesWithUrls, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch shares: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}
