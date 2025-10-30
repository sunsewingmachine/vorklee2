import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { checkSubscription } from '@vorklee2/core-billing';
import { recordAudit, createAuditEvent } from '@vorklee2/core-audit';
import { getNotebooks, createNotebook } from '@/services/notebooks.service';
import { createNotebookSchema } from '@/lib/validations/notes';

/**
 * GET /api/notebooks - Get all notebooks for the organization
 */
export async function GET() {
  try {
    // Development mode: use mock org ID
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;

    if (!skipAuth) {
      // Check subscription
      await checkSubscription(orgId, 'notes');
    }

    // Fetch notebooks
    const notebooksList = await getNotebooks(orgId);

    return NextResponse.json({ notebooks: notebooksList });
  } catch (error) {
    console.error('Get notebooks error:', error);
    return NextResponse.json(
      { error: `Failed to fetch notebooks: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notebooks - Create a new notebook
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
    const validatedData = createNotebookSchema.parse(body);

    // Create notebook
    const notebook = await createNotebook(validatedData, orgId, userId);

    if (!skipAuth) {
      // Record audit event
      await recordAudit(
        createAuditEvent(orgId, userId, 'create', 'notebook', notebook.id, {
          name: notebook.name,
        })
      );
    }

    return NextResponse.json({ notebook }, { status: 201 });
  } catch (error) {
    console.error('Create notebook error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to create notebook: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


