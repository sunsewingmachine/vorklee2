import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { notes, notebooks, tags, noteTags } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { getUserAuth } from '@vorklee2/core-auth';
import { trackFeatureUsage } from '@vorklee2/core-analytics';
import {
  successListResponse,
  errorResponse,
  createError,
  createPaginationMeta,
} from '@/lib/api-response';

/**
 * GET /api/search - Full-text search across notes
 * V5 Specification: PostgreSQL full-text search with filters
 */
export async function GET(request: NextRequest) {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';
    const orgId = skipAuth ? '00000000-0000-0000-0000-000000000001' : (await getUserAuth()).orgId;
    const userId = skipAuth ? '00000000-0000-0000-0000-000000000002' : (await getUserAuth()).userId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const notebookIds = searchParams.get('notebook_ids')?.split(',').filter(Boolean);
    const tagIds = searchParams.get('tag_ids')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    if (!query || query.trim().length === 0) {
      return errorResponse(
        createError('VALIDATION_ERROR', 'Search query is required'),
        request,
        400
      );
    }

    // Build base query with full-text search
    let baseQuery = db
      .select({
        id: notes.id,
        title: notes.title,
        contentPreview: notes.contentPreview,
        wordCount: notes.wordCount,
        isPinned: notes.isPinned,
        isArchived: notes.isArchived,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        userId: notes.userId,
        lastEditedBy: notes.lastEditedBy,
        notebookId: notes.notebookId,
        notebookName: notebooks.name,
        // Calculate relevance rank
        rank: sql<number>`ts_rank(${notes.searchVector}, plainto_tsquery('english', ${query}))`,
      })
      .from(notes)
      .leftJoin(notebooks, eq(notes.notebookId, notebooks.id))
      .where(
        and(
          eq(notes.orgId, orgId),
          eq(notes.isArchived, false),
          // Full-text search condition
          sql`${notes.searchVector} @@ plainto_tsquery('english', ${query})`
        )
      );

    // Apply notebook filter
    if (notebookIds && notebookIds.length > 0) {
      baseQuery = baseQuery.where(
        and(
          eq(notes.orgId, orgId),
          sql`${notes.notebookId} IN (${sql.raw(notebookIds.map(id => `'${id}'`).join(','))})`
        )
      );
    }

    // Apply date range filters
    if (dateFrom) {
      baseQuery = baseQuery.where(
        and(
          eq(notes.orgId, orgId),
          sql`${notes.createdAt} >= ${dateFrom}`
        )
      );
    }

    if (dateTo) {
      baseQuery = baseQuery.where(
        and(
          eq(notes.orgId, orgId),
          sql`${notes.createdAt} <= ${dateTo}`
        )
      );
    }

    // Execute query with pagination
    const offset = (page - 1) * limit;
    const results = await baseQuery
      .orderBy(desc(sql`ts_rank(${notes.searchVector}, plainto_tsquery('english', ${query}))`), desc(notes.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(
        and(
          eq(notes.orgId, orgId),
          eq(notes.isArchived, false),
          sql`${notes.searchVector} @@ plainto_tsquery('english', ${query})`
        )
      );

    const total = Number(countResult?.count || 0);

    // Filter by tags if specified (done in memory for simplicity)
    let filteredResults = results;
    if (tagIds && tagIds.length > 0) {
      // Get notes that have all specified tags
      const notesWithTags = await db
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .where(sql`${noteTags.tagId} IN (${sql.raw(tagIds.map(id => `'${id}'`).join(','))})`);

      const noteIdsWithTags = new Set(notesWithTags.map(n => n.noteId));
      filteredResults = results.filter(note => noteIdsWithTags.has(note.id));
    }

    // For each result, fetch tags
    const resultsWithTags = await Promise.all(
      filteredResults.map(async (note) => {
        const noteTags = await db
          .select({
            id: tags.id,
            name: tags.name,
            color: tags.color,
          })
          .from(tags)
          .innerJoin(noteTags, eq(tags.id, noteTags.tagId))
          .where(eq(noteTags.noteId, note.id));

        return {
          ...note,
          tags: noteTags,
          notebook: note.notebookId
            ? {
                id: note.notebookId,
                name: note.notebookName,
              }
            : null,
        };
      })
    );

    if (!skipAuth) {
      // Track feature usage
      await trackFeatureUsage(orgId, userId, 'search_notes', {
        query,
        resultsCount: resultsWithTags.length,
      });
    }

    // Create pagination metadata
    const pagination = createPaginationMeta(page, limit, total);

    return successListResponse(resultsWithTags, request, pagination);
  } catch (error) {
    return errorResponse(
      createError('INTERNAL_ERROR', `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
      request,
      500
    );
  }
}
