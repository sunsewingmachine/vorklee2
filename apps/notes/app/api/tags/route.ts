import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@core-auth';
import { checkSubscription } from '@core-billing';
import { recordAudit, createAuditEvent } from '@core-audit';
import { getTags, createTag } from '@/services/tags.service';
import { createTagSchema } from '@/lib/validations/notes';

/**
 * GET /api/tags - Get all tags for the organization
 */
export async function GET() {
  try {
    const { orgId } = await getUserAuth();

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Fetch tags
    const tagsList = await getTags(orgId);

    return NextResponse.json({ tags: tagsList });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: `Failed to fetch tags: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags - Create a new tag
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserAuth();

    // Check subscription
    await checkSubscription(orgId, 'notes');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTagSchema.parse(body);

    // Create tag
    const tag = await createTag(validatedData, orgId);

    // Record audit event
    await recordAudit(
      createAuditEvent(orgId, userId, 'create', 'tag', tag.id, {
        name: tag.name,
      })
    );

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Create tag error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

