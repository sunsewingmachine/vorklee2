import { pgTable, uuid, text, timestamp, varchar, integer, index } from 'drizzle-orm/pg-core';

/**
 * File Attachments table - generic file storage
 * Can be used by any app in the platform
 */
export const fileAttachments = pgTable('file_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Entity reference (polymorphic)
  entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'note', 'task', 'document'
  entityId: uuid('entity_id').notNull(),
  
  // Organization isolation
  orgId: uuid('org_id').notNull(),
  userId: uuid('user_id').notNull(), // Created by
  
  // File metadata
  fileName: text('file_name').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(), // MIME type
  fileSize: integer('file_size').notNull(), // Bytes
  fileUrl: text('file_url').notNull(), // S3/R2 URL
  
  // Image-specific metadata
  width: integer('width'),
  height: integer('height'),
  thumbnailUrl: text('thumbnail_url'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    entityIdx: index('idx_file_attachments_entity').on(table.entityType, table.entityId),
    orgIdx: index('idx_file_attachments_org').on(table.orgId),
    userIdx: index('idx_file_attachments_user').on(table.userId),
  };
});

/**
 * Link Attachments table - external links
 * Can be used by any app in the platform
 */
export const linkAttachments = pgTable('link_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Entity reference (polymorphic)
  entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'note', 'task', 'document'
  entityId: uuid('entity_id').notNull(),
  
  // Organization isolation
  orgId: uuid('org_id').notNull(),
  userId: uuid('user_id').notNull(), // Created by
  
  // Link metadata
  url: text('url').notNull(),
  title: text('title'),
  description: text('description'),
  favicon: text('favicon'),
  imageUrl: text('image_url'), // Preview image
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    entityIdx: index('idx_link_attachments_entity').on(table.entityType, table.entityId),
    orgIdx: index('idx_link_attachments_org').on(table.orgId),
    userIdx: index('idx_link_attachments_user').on(table.userId),
    urlIdx: index('idx_link_attachments_url').on(table.url),
  };
});

