import { db } from '@/db/db';
import { notebooks } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { CreateNotebookInput, UpdateNotebookInput } from '@/lib/validations/notes';

/**
 * Get all notebooks for an organization
 */
export async function getNotebooks(organizationId: string) {
  return db
    .select()
    .from(notebooks)
    .where(and(eq(notebooks.orgId, organizationId), eq(notebooks.isArchived, false)))
    .orderBy(asc(notebooks.name));
}

/**
 * Get a single notebook by ID
 */
export async function getNotebookById(notebookId: string, organizationId: string) {
  const result = await db
    .select()
    .from(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.orgId, organizationId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new notebook
 */
export async function createNotebook(data: CreateNotebookInput, organizationId: string, userId: string) {
  const result = await db
    .insert(notebooks)
    .values({
      ...data,
      orgId: organizationId,
      createdBy: userId,
    })
    .returning();

  return result[0];
}

/**
 * Update an existing notebook
 */
export async function updateNotebook(notebookId: string, data: UpdateNotebookInput, organizationId: string) {
  const result = await db
    .update(notebooks)
    .set(data)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.orgId, organizationId)))
    .returning();

  return result[0] || null;
}

/**
 * Delete (archive) a notebook
 */
export async function deleteNotebook(notebookId: string, organizationId: string) {
  await db
    .update(notebooks)
    .set({ isArchived: true })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.orgId, organizationId)));
}




