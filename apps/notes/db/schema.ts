import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

/**
 * App Users table - users specific to Notes App (mapped to org + core user)
 */
export const appUsers = pgTable('app_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  platformUserId: uuid('platform_user_id'),
  email: text('email').notNull(),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Notebooks table - organize notes into folders
 */
export const notebooks = pgTable('notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#1976d2'),
  createdBy: uuid('created_by').references(() => appUsers.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Notes table - main notes content
 */
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  notebookId: uuid('notebook_id').references(() => notebooks.id),
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  createdBy: uuid('created_by').references(() => appUsers.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Tags table - categorize notes
 */
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  color: text('color').default('#757575'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Note Tags junction table - many-to-many relationship
 */
export const noteTags = pgTable('note_tags', {
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: uuid('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
});

/**
 * Attachments table - files attached to notes
 */
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at').defaultNow(),
});


