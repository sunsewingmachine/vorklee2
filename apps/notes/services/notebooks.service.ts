import { db } from '@/db/db';
import { notebooks } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { CreateNotebookInput, UpdateNotebookInput } from '@/lib/validations/notes';

export interface NotebookWithChildren {
  id: string;
  orgId: string;
  createdBy: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  isDefault: boolean | null;
  isArchived: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  children?: NotebookWithChildren[];
}

const MAX_NESTING_DEPTH = 5;

/**
 * Get all notebooks for an organization (flat list)
 */
export async function getNotebooks(organizationId: string) {
  return db
    .select()
    .from(notebooks)
    .where(eq(notebooks.orgId, organizationId))
    .orderBy(asc(notebooks.name));
}

/**
 * Get all notebooks in hierarchical tree structure
 */
export async function getNotebooksHierarchical(organizationId: string): Promise<NotebookWithChildren[]> {
  const allNotebooks = await getNotebooks(organizationId);
  
  // Build tree structure
  const notebookMap = new Map<string, NotebookWithChildren>();
  const rootNotebooks: NotebookWithChildren[] = [];

  // First pass: create map of all notebooks
  for (const notebook of allNotebooks) {
    notebookMap.set(notebook.id, {
      ...notebook,
      children: [],
    });
  }

  // Second pass: build parent-child relationships
  for (const notebook of allNotebooks) {
    const notebookWithChildren = notebookMap.get(notebook.id)!;
    
    if (notebook.parentId) {
      const parent = notebookMap.get(notebook.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(notebookWithChildren);
      } else {
        // Parent not found, treat as root
        rootNotebooks.push(notebookWithChildren);
      }
    } else {
      rootNotebooks.push(notebookWithChildren);
    }
  }

  // Sort recursively
  const sortNotebooks = (notebooks: NotebookWithChildren[]) => {
    notebooks.sort((a, b) => a.name.localeCompare(b.name));
    notebooks.forEach(notebook => {
      if (notebook.children && notebook.children.length > 0) {
        sortNotebooks(notebook.children);
      }
    });
  };

  sortNotebooks(rootNotebooks);
  return rootNotebooks;
}

/**
 * Get breadcrumb path for a notebook (from root to notebook)
 */
export async function getNotebookPath(
  notebookId: string,
  organizationId: string
): Promise<NotebookWithChildren[]> {
  const path: NotebookWithChildren[] = [];
  let currentId: string | null = notebookId;
  const visited = new Set<string>(); // Prevent infinite loops

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const notebook = await getNotebookById(currentId, organizationId);
    
    if (!notebook) break;
    
    path.unshift({
      ...notebook,
      children: [],
    });
    
    currentId = notebook.parentId;
  }

  return path;
}

/**
 * Validate that moving a notebook won't create circular references
 */
export async function validateNotebookMove(
  notebookId: string,
  newParentId: string | null,
  organizationId: string
): Promise<{ valid: boolean; error?: string }> {
  // Cannot move folder into itself
  if (newParentId === notebookId) {
    return { valid: false, error: 'Cannot move folder into itself' };
  }

  if (!newParentId) {
    return { valid: true }; // Moving to root is always valid
  }

  // Verify new parent exists and belongs to same organization
  const newParent = await getNotebookById(newParentId, organizationId);
  if (!newParent) {
    return { valid: false, error: 'Parent notebook not found' };
  }

  // Check if new parent is a descendant of the notebook being moved
  // (this would create a circular reference)
  const path = await getNotebookPath(newParentId, organizationId);
  const isDescendant = path.some(nb => nb.id === notebookId);
  
  if (isDescendant) {
    return { valid: false, error: 'Cannot move folder into its own descendant' };
  }

  // Check nesting depth
  const newParentPath = await getNotebookPath(newParentId, organizationId);
  if (newParentPath.length >= MAX_NESTING_DEPTH) {
    return { valid: false, error: `Maximum nesting depth of ${MAX_NESTING_DEPTH} exceeded` };
  }

  return { valid: true };
}

/**
 * Move a notebook to a different parent
 */
export async function moveNotebook(
  notebookId: string,
  newParentId: string | null,
  organizationId: string
) {
  // Validate the move
  const validation = await validateNotebookMove(notebookId, newParentId, organizationId);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid move operation');
  }

  // Perform the move
  const result = await db
    .update(notebooks)
    .set({
      parentId: newParentId,
      updatedAt: new Date(),
    })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.orgId, organizationId)))
    .returning();

  return result[0] || null;
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
export async function createNotebook(
  data: CreateNotebookInput,
  organizationId: string,
  userId: string
) {
  const result = await db
    .insert(notebooks)
    .values({
      ...data,
      orgId: organizationId,
      createdBy: userId,
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * Update an existing notebook
 */
export async function updateNotebook(
  notebookId: string,
  data: UpdateNotebookInput,
  organizationId: string
) {
  // If parentId is being updated, validate the move
  if (data.parentId !== undefined) {
    const validation = await validateNotebookMove(
      notebookId,
      data.parentId ?? null,
      organizationId
    );
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid parent assignment');
    }
  }

  const result = await db
    .update(notebooks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.orgId, organizationId)))
    .returning();

  return result[0] || null;
}

/**
 * Delete a notebook
 */
export async function deleteNotebook(notebookId: string, organizationId: string) {
  await db
    .delete(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.orgId, organizationId)));
}


