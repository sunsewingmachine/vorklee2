import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { createAttachmentService, validateFileUpload, validateLink } from '@vorklee2/core-attachments';
import { db } from '@/db/db';
import { successResponse, errorResponse, createError } from '@/lib/api-response';

/**
 * POST /api/attachments/files - Upload and create a file attachment
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    if (!file || !entityType || !entityId) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Missing required fields: file, entityType, entityId'),
        request,
        400
      );
    }

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return errorResponse(
        createError('VALIDATION_ERROR', validation.error || 'Invalid file'),
        request,
        400
      );
    }

    // TODO: Upload file to storage (S3/R2/etc)
    // For now, we'll create a placeholder URL
    // In production, implement actual file upload logic
    // Create a proper URL using the request origin
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`;
    const timestamp = Date.now();
    const sanitizedFileName = encodeURIComponent(file.name);
    const fileUrl = `${baseUrl}/api/attachments/files/${entityId}/${timestamp}/${sanitizedFileName}`;
    
    // Get image dimensions if it's an image
    // Note: Image dimensions extraction would require a library like 'sharp' or 'jimp'
    // For now, we'll skip this - it can be added later if needed
    let width: number | undefined;
    let height: number | undefined;

    // Create attachment record
    const attachmentService = createAttachmentService(db);
    const attachment = await attachmentService.createFileAttachment({
      entityType,
      entityId,
      orgId: user.orgId,
      userId: user.userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl,
      width,
      height,
    });

    return successResponse(attachment, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * GET /api/attachments/files - Get file attachments for an entity
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
    const attachments = await attachmentService.getFileAttachments(
      entityType,
      entityId,
      user.orgId
    );

    return successResponse(attachments, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch attachments: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * DELETE /api/attachments/files/[id] - Delete a file attachment
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const user = skipAuth
      ? { orgId: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000002' }
      : await getUserAuth();

    if (!skipAuth) {
      await checkSubscription(user.orgId, 'notes');
    }

    const { id } = await context.params;

    const attachmentService = createAttachmentService(db);
    await attachmentService.deleteFileAttachment(id, user.orgId);

    return successResponse({ id, message: 'Attachment deleted successfully' }, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to delete attachment: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

