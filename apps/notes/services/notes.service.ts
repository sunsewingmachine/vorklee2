import { db } from '@/db/db';
import { notes, noteTags, tags } from '@/db/schema';
import { eq, and, desc, asc, count, sql, inArray } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '@vorklee2/core-utils';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/validations/notes';

interface PaginationOptions {
  page?: number;
  limit?: number;
  tagIds?: string[];
}

interface NoteWithTags extends InferSelectModel<typeof notes> {
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get tags for a note
 */
export async function getTagsForNote(noteId: string) {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(tags)
    .innerJoin(noteTags, eq(tags.id, noteTags.tagId))
    .where(eq(noteTags.noteId, noteId));
}

/**
 * Get all notes for an organization with pagination and caching
 */
export async function getNotes(
  organizationId: string,
  includeArchived = false,
  pagination?: PaginationOptions
): Promise<PaginatedResult<NoteWithTags>> {
  const page = pagination?.page || 1;
  const limit = Math.min(pagination?.limit || 20, 100); // Max 100 per page
  const offset = (page - 1) * limit;
  const tagIds = pagination?.tagIds;

  // Build cache key with tagIds
  const tagKey = tagIds && tagIds.length > 0 ? tagIds.sort().join(',') : 'none';
  const cacheKey = `notes:list:${organizationId}:${page}:${limit}:${includeArchived}:${tagKey}`;

  // Try cache first (cache-aside pattern)
  const cached = await cacheGet<PaginatedResult<NoteWithTags>>(cacheKey);
  if (cached) {
    return cached;
  }

  // Build base query
  let baseQuery = includeArchived
    ? eq(notes.orgId, organizationId)
    : and(eq(notes.orgId, organizationId), eq(notes.isArchived, false));

  // If filtering by tags, use inner join
  if (tagIds && tagIds.length > 0) {
    // Get note IDs that have all the specified tags
    const notesWithTags = await db
      .select({ noteId: noteTags.noteId })
      .from(noteTags)
      .where(inArray(noteTags.tagId, tagIds))
      .groupBy(noteTags.noteId)
      .having(sql`COUNT(DISTINCT ${noteTags.tagId}) = ${tagIds.length}`);
    
    const filteredNoteIds = notesWithTags.map((n) => n.noteId);
    
    if (filteredNoteIds.length === 0) {
      // No notes match the tag filter
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }
    
    baseQuery = and(baseQuery, inArray(notes.id, filteredNoteIds));
  }

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(notes)
    .where(baseQuery);
  const total = totalResult[0]?.count || 0;

  // Get paginated data
  const notesData = await db
    .select()
    .from(notes)
    .where(baseQuery)
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt))
    .limit(limit)
    .offset(offset);

  // Get tags for all notes in batch
  const noteIds = notesData.map((n) => n.id);
  const allTags = noteIds.length > 0
    ? await db
        .select({
          noteId: noteTags.noteId,
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(inArray(noteTags.noteId, noteIds))
    : [];

  // Group tags by note ID
  const tagsByNoteId = new Map<string, Array<{ id: string; name: string; color: string | null }>>();
  allTags.forEach((tag) => {
    if (!tagsByNoteId.has(tag.noteId)) {
      tagsByNoteId.set(tag.noteId, []);
    }
    tagsByNoteId.get(tag.noteId)!.push({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    });
  });

  // Attach tags to notes
  const data: NoteWithTags[] = notesData.map((note) => ({
    ...note,
    tags: tagsByNoteId.get(note.id) || [],
  }));

  const result: PaginatedResult<NoteWithTags> = {
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
export async function getNoteById(noteId: string, organizationId: string): Promise<NoteWithTags | null> {
  // Cache key: notes:detail:{orgId}:{noteId}
  const cacheKey = `notes:detail:${organizationId}:${noteId}`;

  // Try cache first
  const cached = await cacheGet<NoteWithTags>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.orgId, organizationId)))
    .limit(1);

  const note = result[0] || null;

  if (note) {
    // Get tags for the note
    const noteTags = await getTagsForNote(noteId);
    const noteWithTags: NoteWithTags = {
      ...note,
      tags: noteTags,
    };

    // Store in cache with TTL (10 minutes)
    await cacheSet(cacheKey, noteWithTags, { ttl: 600 });

    return noteWithTags;
  }

  return null;
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
      orgId: organizationId,
      userId,
      lastEditedBy: userId,
      updatedAt: new Date(),
    })
    .returning();

  const note = result[0];

  // Invalidate related caches
  await cacheDeletePattern(`notes:list:${organizationId}:*`);
  await cacheDeletePattern(`tags:list:${organizationId}`);

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
    .where(and(eq(notes.id, noteId), eq(notes.orgId, organizationId)))
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
    .where(and(eq(notes.id, noteId), eq(notes.orgId, organizationId)))
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
    .where(and(eq(notes.id, noteId), eq(notes.orgId, organizationId)));
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
    .where(and(eq(notes.id, noteId), eq(notes.orgId, organizationId)))
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
        eq(notes.orgId, organizationId),
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

/**
 * Replace all tags for a note
 */
export async function replaceTagsForNote(noteId: string, tagIds: string[]) {
  // Get current tags
  const currentTags = await db
    .select({ tagId: noteTags.tagId })
    .from(noteTags)
    .where(eq(noteTags.noteId, noteId));

  const currentTagIds = currentTags.map((t) => t.tagId);
  const newTagIds = tagIds || [];

  // Find tags to remove and add
  const toRemove = currentTagIds.filter((id) => !newTagIds.includes(id));
  const toAdd = newTagIds.filter((id) => !currentTagIds.includes(id));

  // Remove old tags
  if (toRemove.length > 0) {
    await removeTagsFromNote(noteId, toRemove);
  }

  // Add new tags
  if (toAdd.length > 0) {
    await addTagsToNote(noteId, toAdd);
  }

  // Invalidate cache
  await cacheDeletePattern(`notes:detail:*:${noteId}`);
  await cacheDeletePattern(`notes:list:*`);
}


