import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

