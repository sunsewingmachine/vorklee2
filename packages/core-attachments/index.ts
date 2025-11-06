/**
 * @vorklee2/core-attachments
 * 
 * Global attachments module for handling images, PDFs, and links
 * Can be used by any app in the Vorklee2 platform
 * 
 * Features:
 * - File attachments (images, PDFs)
 * - Link attachments
 * - Database schema (Drizzle ORM)
 * - Validation utilities
 * - Service layer for CRUD operations
 * - Type-safe interfaces
 */

// Types and interfaces
export * from './types';

// Database schema
export * from './schema';

// Validation utilities
export * from './validators';

// Service layer
export * from './service';

// React hooks are exported separately - import from '@vorklee2/core-attachments/hooks'
// This allows the package to work in non-React environments

