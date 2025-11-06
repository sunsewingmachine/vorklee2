import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { updateTag, deleteTag, getTagById } from '@/services/tags.service';
import { updateTagSchema } from '@/lib/validations/notes';

/**
 * PATCH /api/tags/[id] - Update a tag
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
    const validatedData = updateTagSchema.parse(body);

    // Update tag
    const tag = await updateTag(id, validatedData, orgId);

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'update', 'tag', tag.id, {
          changes: validatedData,
        })
      );
    }

    return NextResponse.json({ data: tag });
  } catch (error) {
    console.error('Update tag error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tags/[id] - Delete a tag
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

    // Check if tag exists
    const tag = await getTagById(id, orgId);

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Delete tag
    await deleteTag(id, orgId);

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'delete', 'tag', tag.id, {
          name: tag.name,
        })
      );
    }

    return NextResponse.json({ data: { id, message: 'Tag deleted successfully' } });
  } catch (error) {
    console.error('Delete tag error:', error);

    return NextResponse.json(
      { error: `Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}





