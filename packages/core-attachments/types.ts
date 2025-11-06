import { z } from 'zod';

/**
 * Attachment types supported by the core-attachments module
 */
export type AttachmentType = 'image' | 'pdf' | 'link';

/**
 * File attachment metadata
 */
export interface FileAttachment {
  id: string;
  entityType: string; // e.g., 'note', 'task', 'document'
  entityId: string;   // ID of the parent entity
  orgId: string;
  userId: string;     // Created by
  
  // File metadata
  fileName: string;
  fileType: string;   // MIME type
  fileSize: number;   // Bytes
  fileUrl: string;    // Storage URL (S3/R2/etc)
  
  // Image-specific metadata
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Link attachment metadata
 */
export interface LinkAttachment {
  id: string;
  entityType: string; // e.g., 'note', 'task', 'document'
  entityId: string;   // ID of the parent entity
  orgId: string;
  userId: string;     // Created by
  
  // Link metadata
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  imageUrl?: string;  // Preview image
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Unified attachment type
 */
export type Attachment = FileAttachment | LinkAttachment;

/**
 * Attachment creation input
 */
export interface CreateFileAttachmentInput {
  entityType: string;
  entityId: string;
  orgId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface CreateLinkAttachmentInput {
  entityType: string;
  entityId: string;
  orgId: string;
  userId: string;
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  imageUrl?: string;
}

/**
 * Attachment update input
 */
export interface UpdateAttachmentInput {
  fileName?: string;
  title?: string;
  description?: string;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/**
 * Attachment validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Supported image MIME types
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
] as const;

/**
 * Supported PDF MIME type
 */
export const PDF_MIME_TYPE = 'application/pdf' as const;

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Maximum image dimensions
 */
export const MAX_IMAGE_WIDTH = 10000;
export const MAX_IMAGE_HEIGHT = 10000;

/**
 * Image metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
}

/**
 * Link metadata
 */
export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  imageUrl?: string;
}

// Zod schemas for validation
export const createFileAttachmentSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  fileUrl: z.string().url(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const createLinkAttachmentSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  favicon: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

