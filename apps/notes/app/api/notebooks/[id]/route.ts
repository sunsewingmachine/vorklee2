import { NextRequest } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { getNotebookById, updateNotebook, deleteNotebook } from '@/services/notebooks.service';
import { updateNotebookSchema } from '@/lib/validations/notes';
import { successResponse, errorResponse, createError } from '@/lib/api-response';

/**
 * GET /api/notebooks/[id] - Get a single notebook
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const { id } = await context.params;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Fetch notebook
    const notebook = await getNotebookById(id, orgId);

    if (!notebook) {
      return errorResponse(createError('NOT_FOUND', 'Notebook not found'), request, 404);
    }

    return successResponse(notebook, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to fetch notebook: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * PATCH /api/notebooks/[id] - Update a notebook
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;
    const { id } = await context.params;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNotebookSchema.parse(body);

    // Update notebook
    const notebook = await updateNotebook(id, validatedData, orgId);

    if (!notebook) {
      return errorResponse(createError('NOT_FOUND', 'Notebook not found'), request, 404);
    }

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'update', 'notebook', notebook.id, {
          changes: validatedData,
        })
      );
    }

    return successResponse(notebook, request);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Validation failed', { message: error.message }),
        request,
        400
      );
    }

    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to update notebook: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}

/**
 * DELETE /api/notebooks/[id] - Delete (archive) a notebook
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;
    const { id } = await context.params;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Get notebook before deletion for audit
    const notebook = await getNotebookById(id, orgId);

    if (!notebook) {
      return errorResponse(createError('NOT_FOUND', 'Notebook not found'), request, 404);
    }

    // Delete notebook (soft delete)
    await deleteNotebook(id, orgId);

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'delete', 'notebook', notebook.id)
      );
    }

    return successResponse({ id: notebook.id, message: 'Notebook deleted successfully' }, request);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Failed to delete notebook: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}



