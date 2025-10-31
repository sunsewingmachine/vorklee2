import { NextRequest } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { trackFeatureUsage } from '@vorklee2/core-analytics';
import { getNotes, createNote } from '@/services/notes.service';
import { createNoteSchema } from '@/lib/validations/notes';
import {
  successListResponse,
  successResponse,
  errorResponse,
  createError,
  createPaginationMeta,
  generatePaginationLinks,
} from '@/lib/api-response';

/**
 * GET /api/notes - Get all notes for the organization
 */
export async function GET(request: NextRequest) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Fetch notes with pagination
    const result = await getNotes(orgId, includeArchived, { page, limit });

    if (!skipAuth) {
      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'list_notes');
    }

    // Create pagination metadata
    const pagination = createPaginationMeta(page, limit, result.total);

    // Generate HATEOAS links
    const baseUrl = request.url.split('?')[0]; // Remove query params
    const links = generatePaginationLinks(baseUrl, page, limit, pagination.totalPages);

    return successListResponse(result.data, request, pagination, links);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch notes: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * POST /api/notes - Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // Create note
    const note = await createNote(validatedData, orgId, userId);

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'create', 'note', note.id, {
          title: note.title,
        })
      );

      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'create_note');
    }

    return successResponse(note, request, 201);
  } catch (error) {
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Validation failed', {
          message: error.message,
        }),
        request,
        400
      );
    }

    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}


