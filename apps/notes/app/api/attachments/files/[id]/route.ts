import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { createAttachmentService } from '@vorklee2/core-attachments';
import { db } from '@/db/db';
import { successResponse, errorResponse, createError } from '@/lib/api-response';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

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
    
    // Get attachment first to get file URL before deletion
    const attachment = await attachmentService.getFileAttachmentById(id, user.orgId);
    
    // Delete from database
    await attachmentService.deleteFileAttachment(id, user.orgId);

    // Delete the physical file if it exists
    if (attachment?.fileUrl) {
      try {
        const fileName = attachment.fileUrl.split('/').pop();
        if (fileName) {
          const filePath = join(UPLOADS_DIR, fileName);
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
