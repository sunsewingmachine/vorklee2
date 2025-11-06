import { NextRequest } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { createAttachmentService, validateLink } from '@vorklee2/core-attachments';
import { db } from '@/db/db';
import { successResponse, errorResponse, createError } from '@/lib/api-response';

/**
 * POST /api/attachments/links - Create a link attachment
 */
export async function POST(request: NextRequest) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const user = skipAuth
      ? { orgId: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000002' }
      : await getUserAuth();

    if (!skipAuth) {
      await checkSubscription(user.orgId, 'notes');
    }

    const body = await request.json();
    const { url, entityType, entityId, title, description, favicon, imageUrl } = body;

    if (!url || !entityType || !entityId) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Missing required fields: url, entityType, entityId'),
        request,
        400
      );
    }

    // Validate link
    const validation = validateLink(url);
    if (!validation.valid) {
      return errorResponse(
        createError('VALIDATION_ERROR', validation.error || 'Invalid URL'),
        request,
        400
      );
    }

    // Create attachment record
    const attachmentService = createAttachmentService(db);
    const attachment = await attachmentService.createLinkAttachment({
      entityType,
      entityId,
      orgId: user.orgId,
      userId: user.userId,
      url,
      title,
      description,
      favicon,
      imageUrl,
    });

    return successResponse(attachment, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to create link: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * GET /api/attachments/links - Get link attachments for an entity
 */
export async function GET(request: NextRequest) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const user = skipAuth
      ? { orgId: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000002' }
      : await getUserAuth();

    if (!skipAuth) {
      await checkSubscription(user.orgId, 'notes');
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Missing required query params: entityType, entityId'),
        request,
        400
      );
    }

    const attachmentService = createAttachmentService(db);
    const attachments = await attachmentService.getLinkAttachments(
      entityType,
      entityId,
      user.orgId
    );

    return successResponse(attachments, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch links: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

