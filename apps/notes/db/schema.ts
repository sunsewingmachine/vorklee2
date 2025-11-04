import { pgTable, uuid, text, timestamp, boolean, integer, varchar, primaryKey, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Notebooks table - organize notes into collections
 * V5 Specification: Enhanced with icon, default flag, and archive support
 */
export const notebooks = pgTable('notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(), // Changed from organizationId to match V5
  createdBy: uuid('created_by').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color #3B82F6
  icon: varchar('icon', { length: 50 }), // Icon identifier
  isDefault: boolean('is_default').default(false),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    orgIdIdx: index('idx_notebooks_org').on(table.orgId),
  };
});

/**
 * Notes table - core note content
 * V5 Specification: Enhanced with version tracking, search vector, and templates
 */
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  userId: uuid('user_id').notNull(),
  notebookId: uuid('notebook_id').references(() => notebooks.id, { onDelete: 'set null' }),

  // Content
  title: text('title'),
  content: text('content'), // Markdown content
  contentPreview: text('content_preview'), // First 200 chars
  wordCount: integer('word_count').default(0),

  // Metadata
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  isTemplate: boolean('is_template').default(false),

  // Version tracking
  version: integer('version').default(1),
  lastEditedBy: uuid('last_edited_by').notNull(),

  // Note: search_vector (tsvector) requires raw SQL - will be added via migration

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
}, (table) => {
  return {
    orgUserIdx: index('idx_notes_org_user').on(table.orgId, table.userId),
    notebookIdx: index('idx_notes_notebook').on(table.notebookId),
    updatedIdx: index('idx_notes_updated').on(table.updatedAt),
    pinnedIdx: index('idx_notes_pinned').on(table.orgId, table.isPinned),
  };
});

/**
 * Tags table - flexible categorization
 * V5 Specification: With org isolation and unique constraint
 */
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  name: text('name').notNull(),
  color: varchar('color', { length: 7 }), // Hex color #EF4444
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    orgIdIdx: index('idx_tags_org').on(table.orgId),
    orgNameUnique: unique('tags_org_name_unique').on(table.orgId, table.name),
  };
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.noteId, table.tagId] }),
    noteIdx: index('idx_note_tags_note').on(table.noteId),
    tagIdx: index('idx_note_tags_tag').on(table.tagId),
  };
});

/**
 * Attachments table - file uploads
 * V5 Specification: Enhanced with virus scanning and image metadata
 */
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),

  // File metadata
  fileName: text('file_name').notNull(),
  fileType: varchar('file_type', { length: 100 }), // MIME type
  fileSize: integer('file_size').notNull(), // Bytes
  fileUrl: text('file_url').notNull(), // S3/R2 URL

  // Image-specific metadata
  width: integer('width'),
  height: integer('height'),
  thumbnailUrl: text('thumbnail_url'),

  // Security
  virusScanStatus: varchar('virus_scan_status', { length: 20 }).default('pending'), // pending, clean, infected
  virusScanAt: timestamp('virus_scan_at', { withTimezone: true }),

  uploadedBy: uuid('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    noteIdx: index('idx_attachments_note').on(table.noteId),
    scanPendingIdx: index('idx_attachments_scan_pending').on(table.virusScanStatus),
  };
});

/**
 * Sharing table - note collaboration and permissions
 * V5 Specification: User, org, and public link sharing
 */
export const noteShares = pgTable('note_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),
  sharedBy: uuid('shared_by').notNull(),
  sharedWithUserId: uuid('shared_with_user_id'),
  sharedWithOrgId: uuid('shared_with_org_id'),

  // Permissions
  permission: varchar('permission', { length: 20 }).notNull(), // view, comment, edit

  // Link sharing
  isPublicLink: boolean('is_public_link').default(false),
  publicLinkToken: varchar('public_link_token', { length: 64 }),
  publicLinkExpiresAt: timestamp('public_link_expires_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    noteIdx: index('idx_note_shares_note').on(table.noteId),
    userIdx: index('idx_note_shares_user').on(table.sharedWithUserId),
    publicTokenUnique: unique('note_shares_public_token_unique').on(table.publicLinkToken),
  };
});

/**
 * Comments table - inline collaboration
 * V5 Specification: Threaded comments with position tracking
 */
export const noteComments = pgTable('note_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').notNull(),

  // Comment content
  content: text('content').notNull(),

  // Threading (self-reference)
  parentCommentId: uuid('parent_comment_id'),

  // Position in document (for inline comments)
  positionStart: integer('position_start'),
  positionEnd: integer('position_end'),

  // Status
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    noteIdx: index('idx_note_comments_note').on(table.noteId),
    parentIdx: index('idx_note_comments_parent').on(table.parentCommentId),
  };
});

/**
 * Version History table - track changes
 * V5 Specification: Full version tracking with snapshots
 */
export const noteVersions = pgTable('note_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),
  versionNumber: integer('version_number').notNull(),

  // Snapshot
  title: text('title'),
  content: text('content'),

  // Change metadata
  changedBy: uuid('changed_by').notNull(),
  changeSummary: text('change_summary'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    noteVersionIdx: index('idx_note_versions_note').on(table.noteId, table.versionNumber),
    noteVersionUnique: unique('note_versions_note_version_unique').on(table.noteId, table.versionNumber),
  };
});

/**
 * Active Sessions table - real-time collaboration
 * V5 Specification: WebSocket session tracking
 */
export const activeSessions = pgTable('active_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id')
    .references(() => notes.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').notNull(),

  // Session state
  cursorPosition: integer('cursor_position'),
  selectionStart: integer('selection_start'),
  selectionEnd: integer('selection_end'),

  // WebSocket connection
  connectionId: varchar('connection_id', { length: 100 }).notNull(),

  // Activity tracking
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    noteIdx: index('idx_active_sessions_note').on(table.noteId),
    userIdx: index('idx_active_sessions_user').on(table.userId),
    activityIdx: index('idx_active_sessions_activity').on(table.lastActivityAt),
    connectionUnique: unique('active_sessions_connection_unique').on(table.connectionId),
    noteUserUnique: unique('active_sessions_note_user_unique').on(table.noteId, table.userId),
  };
});


