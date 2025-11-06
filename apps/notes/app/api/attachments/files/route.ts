import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { createAttachmentService, validateFileUpload, validateLink } from '@vorklee2/core-attachments';
import { db } from '@/db/db';
import { successResponse, errorResponse, createError } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Ensure uploads directory exists
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
}

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

    // Store file temporarily (in production, use S3/R2/etc)
    await ensureUploadsDir();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${entityId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(UPLOADS_DIR, fileName);
    
    try {
      await writeFile(filePath, fileBuffer);
    } catch (error) {
      console.error('Error writing file:', error);
      return errorResponse(
        createError('INTERNAL_ERROR', `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`),
        request,
        500
      );
    }

    // Create a proper URL to serve the file
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3001';
    const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`;
    const fileUrl = `${baseUrl}/api/attachments/files/${fileName}`;
    
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

