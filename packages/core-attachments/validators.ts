import { z } from 'zod';
import {
  createFileAttachmentSchema,
  createLinkAttachmentSchema,
  ImageMetadata,
  LinkMetadata,
  ValidationResult,
  IMAGE_MIME_TYPES,
  PDF_MIME_TYPE,
  MAX_FILE_SIZE,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
} from './types';

/**
 * Validate file attachment input
 */
export function validateFileAttachment(input: unknown): ValidationResult {
  try {
    createFileAttachmentSchema.parse(input);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate link attachment input
 */
export function validateLinkAttachment(input: unknown): ValidationResult {
  try {
    createLinkAttachmentSchema.parse(input);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate file MIME type
 */
export function isValidImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.includes(mimeType as any);
}

export function isValidPdfMimeType(mimeType: string): boolean {
  return mimeType === PDF_MIME_TYPE;
}

export function isValidFileMimeType(mimeType: string): boolean {
  return isValidImageMimeType(mimeType) || isValidPdfMimeType(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}

/**
 * Validate image dimensions
 */
export function isValidImageDimensions(width: number, height: number): boolean {
  return (
    width > 0 &&
    width <= MAX_IMAGE_WIDTH &&
    height > 0 &&
    height <= MAX_IMAGE_HEIGHT
  );
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL schemes (http, https)
 */
export function isValidUrlScheme(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate file attachment with comprehensive checks
 */
export function validateFileUpload(
  file: {
    name: string;
    type: string;
    size: number;
  },
  imageMetadata?: ImageMetadata
): ValidationResult {
  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    return { valid: false, error: 'File name is required' };
  }

  // Check file size
  if (!isValidFileSize(file.size)) {
    return {
      valid: false,
      error: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!isValidFileMimeType(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported types: images (${IMAGE_MIME_TYPES.join(', ')}) and PDF`,
    };
  }

  // If it's an image, validate dimensions if provided
  if (isValidImageMimeType(file.type) && imageMetadata) {
    if (!isValidImageDimensions(imageMetadata.width, imageMetadata.height)) {
      return {
        valid: false,
        error: `Image dimensions must be between 1x1 and ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate link attachment
 */
export function validateLink(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  if (!isValidUrl(url)) {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (!isValidUrlScheme(url)) {
    return { valid: false, error: 'URL must use http or https protocol' };
  }

  return { valid: true };
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get attachment type from MIME type
 */
export function getAttachmentTypeFromMime(mimeType: string): 'image' | 'pdf' | null {
  if (isValidImageMimeType(mimeType)) {
    return 'image';
  }
  if (isValidPdfMimeType(mimeType)) {
    return 'pdf';
  }
  return null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

