import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { getNotebookById, updateNotebook, deleteNotebook } from '@/services/notebooks.service';
import { updateNotebookSchema } from '@/lib/validations/notes';

/**
 * GET /api/notebooks/[id] - Get a single notebook
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getUserAuth();
    const { id } = await context.params;

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Fetch notebook
    const notebook = await getNotebookById(id, orgId);

    if (!notebook) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }

    return NextResponse.json({ notebook });
  } catch (error) {
    console.error('Get notebook error:', error);
    return NextResponse.json(
      { error: `Failed to fetch notebook: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
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
    const { userId, orgId } = await getUserAuth();
    const { id } = await context.params;

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNotebookSchema.parse(body);

    // Update notebook
    const notebook = await updateNotebook(id, validatedData, orgId);

    if (!notebook) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }

    // Record audit event
    await recordAudit(
      createAuditEvent(orgId, userId, 'update', 'notebook', notebook.id, {
        changes: validatedData,
      })
    );

    return NextResponse.json({ notebook });
  } catch (error) {
    console.error('Update notebook error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to update notebook: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notebooks/[id] - Delete a notebook
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserAuth();
    const { id } = await context.params;

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Delete notebook
    await deleteNotebook(id, orgId);

    // Record audit event
    await recordAudit(createAuditEvent(orgId, userId, 'delete', 'notebook', id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notebook error:', error);
    return NextResponse.json(
      { error: `Failed to delete notebook: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


