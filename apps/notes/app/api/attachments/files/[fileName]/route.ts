import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { createAttachmentService } from '@vorklee2/core-attachments';
import { db } from '@/db/db';
import { successResponse, errorResponse, createError } from '@/lib/api-response';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

/**
 * GET /api/attachments/files/[fileName] - Serve uploaded file
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await context.params;
    
    // Security: Prevent directory traversal
    const safeFileName = fileName.replace(/\.\./g, '').replace(/\//g, '');
    const filePath = join(UPLOADS_DIR, safeFileName);

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Determine content type from file extension
    const ext = safeFileName.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      svg: 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}

/**
 * DELETE /api/attachments/files/[fileName] - Delete a file attachment by ID
 * Note: fileName parameter is used for routing, but we treat it as attachment ID
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileName: string }> }
) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const user = skipAuth
      ? { orgId: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000002' }
      : await getUserAuth();

    if (!skipAuth) {
      await checkSubscription(user.orgId, 'notes');
    }

    const { fileName } = await context.params;
    // Treat fileName as attachment ID for DELETE operations
    const id = fileName;

    const attachmentService = createAttachmentService(db);
    
    // Get attachment first to get file URL before deletion
    const attachment = await attachmentService.getFileAttachmentById(id, user.orgId);
    
    // Delete from database
    await attachmentService.deleteFileAttachment(id, user.orgId);

    // Delete the physical file if it exists
    if (attachment?.fileUrl) {
      try {
        const actualFileName = attachment.fileUrl.split('/').pop();
        if (actualFileName) {
          const filePath = join(UPLOADS_DIR, actualFileName);
          if (existsSync(filePath)) {
            await unlink(filePath);
          }
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue even if file deletion fails
      }
    }

    return successResponse({ id, message: 'Attachment deleted successfully' }, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to delete attachment: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

