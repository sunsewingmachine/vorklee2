import { db } from '@/db/db';
import { tags } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { CreateTagInput, UpdateTagInput } from '@/lib/validations/notes';

/**
 * Get all tags for an organization
 */
export async function getTags(organizationId: string) {
  return db
    .select()
    .from(tags)
    .where(eq(tags.organizationId, organizationId))
    .orderBy(asc(tags.name));
}

/**
 * Get a single tag by ID
 */
export async function getTagById(tagId: string, organizationId: string) {
  const result = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new tag
 */
export async function createTag(data: CreateTagInput, organizationId: string) {
  const result = await db
    .insert(tags)
    .values({
      ...data,
      organizationId,
    })
    .returning();

  return result[0];
}

/**
 * Update an existing tag
 */
export async function updateTag(tagId: string, data: UpdateTagInput, organizationId: string) {
  const result = await db
    .update(tags)
    .set(data)
    .where(and(eq(tags.id, tagId), eq(tags.organizationId, organizationId)))
    .returning();

  return result[0] || null;
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string, organizationId: string) {
  await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.organizationId, organizationId)));
}

