import { db } from '@/db/db';
import { notes, noteTags } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/validations/notes';

/**
 * Get all notes for an organization
 */
export async function getNotes(organizationId: string, includeArchived = false) {
  const query = includeArchived
    ? eq(notes.organizationId, organizationId)
    : and(eq(notes.organizationId, organizationId), eq(notes.isArchived, false));

  return db
    .select()
    .from(notes)
    .where(query)
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
}

/**
 * Get a single note by ID
 */
export async function getNoteById(noteId: string, organizationId: string) {
  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new note
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

  return result[0];
}

/**
 * Update an existing note
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

  return result[0] || null;
}

/**
 * Delete a note (soft delete by archiving)
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

  return result[0] || null;
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


