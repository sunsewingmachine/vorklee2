import { db } from '@/db/db';
import { notes, noteTags } from '@/db/schema';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '@vorklee2/core-utils';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/validations/notes';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get all notes for an organization with pagination and caching
 */
export async function getNotes(
  organizationId: string,
  includeArchived = false,
  pagination?: PaginationOptions
): Promise<PaginatedResult<typeof notes.$inferSelect>> {
  const page = pagination?.page || 1;
  const limit = Math.min(pagination?.limit || 20, 100); // Max 100 per page
  const offset = (page - 1) * limit;

  // Cache key pattern: notes:list:{orgId}:{page}:{limit}:{archived}
  const cacheKey = `notes:list:${organizationId}:${page}:${limit}:${includeArchived}`;

  // Try cache first (cache-aside pattern)
  const cached = await cacheGet<PaginatedResult<typeof notes.$inferSelect>>(cacheKey);
  if (cached) {
    return cached;
  }

  // Build query
  const query = includeArchived
    ? eq(notes.organizationId, organizationId)
    : and(eq(notes.organizationId, organizationId), eq(notes.isArchived, false));

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(notes)
    .where(query);
  const total = totalResult[0]?.count || 0;

  // Get paginated data
  const data = await db
    .select()
    .from(notes)
    .where(query)
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt))
    .limit(limit)
    .offset(offset);

  const result: PaginatedResult<typeof notes.$inferSelect> = {
    data,
    total,
    page,
    limit,
  };

  // Store in cache with TTL (5 minutes)
  await cacheSet(cacheKey, result, { ttl: 300 });

  return result;
}

/**
 * Get a single note by ID with caching
 */
export async function getNoteById(noteId: string, organizationId: string) {
  // Cache key: notes:detail:{orgId}:{noteId}
  const cacheKey = `notes:detail:${organizationId}:${noteId}`;

  // Try cache first
  const cached = await cacheGet<typeof notes.$inferSelect>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.organizationId, organizationId)))
    .limit(1);

  const note = result[0] || null;

  // Store in cache with TTL (10 minutes) if found
  if (note) {
    await cacheSet(cacheKey, note, { ttl: 600 });
  }

  return note;
}

/**
 * Create a new note with cache invalidation
 */
export async function createNote(
  data: CreateNoteInput,
  organizationId: string,
  userId: string
) {
  const result = await db
    .insert(notes)
    .values({
      ...data,
      organizationId,
      createdBy: userId,
      updatedAt: new Date(),
    })
    .returning();

  const note = result[0];

  // Invalidate related caches
  await cacheDeletePattern(`notes:list:${organizationId}:*`);
  await cacheDeletePattern(`tags:list:${organizationId}`);
  await cacheDeletePattern(`notebooks:list:${organizationId}`);

  return note;
}

/**
 * Update an existing note with cache invalidation
 */
export async function updateNote(
  noteId: string,
  data: UpdateNoteInput,
  organizationId: string
) {
  const result = await db
    .update(notes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, noteId), eq(notes.organizationId, organizationId)))
    .returning();

  const note = result[0] || null;

  if (note) {
    // Invalidate caches
    await cacheDelete(`notes:detail:${organizationId}:${noteId}`);
    await cacheDeletePattern(`notes:list:${organizationId}:*`);
  }

  return note;
}

/**
 * Delete a note (soft delete by archiving) with cache invalidation
 */
export async function deleteNote(noteId: string, organizationId: string) {
  const result = await db
    .update(notes)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, noteId), eq(notes.organizationId, organizationId)))
    .returning();

  const note = result[0] || null;

  if (note) {
    // Invalidate caches
    await cacheDelete(`notes:detail:${organizationId}:${noteId}`);
    await cacheDeletePattern(`notes:list:${organizationId}:*`);
  }

  return note;
}

/**
 * Permanently delete a note
 */
export async function permanentlyDeleteNote(noteId: string, organizationId: string) {
  await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.organizationId, organizationId)));
}

/**
 * Restore an archived note
 */
export async function restoreNote(noteId: string, organizationId: string) {
  const result = await db
    .update(notes)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, noteId), eq(notes.organizationId, organizationId)))
    .returning();

  return result[0] || null;
}

/**
 * Get notes by notebook
 */
export async function getNotesByNotebook(notebookId: string, organizationId: string) {
  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.notebookId, notebookId),
        eq(notes.organizationId, organizationId),
        eq(notes.isArchived, false)
      )
    )
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
}

/**
 * Add tags to a note
 */
export async function addTagsToNote(noteId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;

  const values = tagIds.map((tagId) => ({
    noteId,
    tagId,
  }));

  await db.insert(noteTags).values(values);
}

/**
 * Remove tags from a note
 */
export async function removeTagsFromNote(noteId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;

  for (const tagId of tagIds) {
    await db
      .delete(noteTags)
      .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)));
  }
}


