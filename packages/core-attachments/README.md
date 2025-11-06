# @vorklee2/core-attachments

Global attachments module for handling images, PDFs, and links across any app in the Vorklee2 platform.

## Features

- ✅ **File Attachments**: Support for images (JPEG, PNG, GIF, WebP, SVG, BMP) and PDFs
- ✅ **Link Attachments**: Store and manage external links with metadata
- ✅ **Database Schema**: Drizzle ORM compatible schema for PostgreSQL
- ✅ **Validation**: Comprehensive validation utilities for files and links
- ✅ **Service Layer**: Type-safe CRUD operations for attachments
- ✅ **Multi-tenant**: Built-in organization isolation
- ✅ **Entity Agnostic**: Works with any entity type (notes, tasks, documents, etc.)

## Installation

The package is part of the Vorklee2 monorepo. To use it in your app:

```typescript
import {
  fileAttachments,
  linkAttachments,
  AttachmentService,
  createAttachmentService,
  validateFileUpload,
  validateLink,
} from '@vorklee2/core-attachments';
```

## Database Setup

### 1. Add Schema to Your Database

Include the attachment schemas in your database schema file:

```typescript
import { fileAttachments, linkAttachments } from '@vorklee2/core-attachments';

// Export both schemas for Drizzle migrations
export { fileAttachments, linkAttachments };
```

### 2. Run Migrations

```bash
npm run db:push
# or
drizzle-kit push
```

## Usage Examples

### Initialize the Service

```typescript
import { createAttachmentService } from '@vorklee2/core-attachments';
import { db } from '@/db/db';

const attachmentService = createAttachmentService(db);
```

### Create a File Attachment

```typescript
import { AttachmentService } from '@vorklee2/core-attachments';

// After uploading file to storage (S3/R2/etc)
const fileAttachment = await attachmentService.createFileAttachment({
  entityType: 'note', // or 'task', 'document', etc.
  entityId: noteId,
  orgId: userSession.orgId,
  userId: userSession.userId,
  fileName: 'example.jpg',
  fileType: 'image/jpeg',
  fileSize: 1024000, // bytes
  fileUrl: 'https://storage.example.com/files/abc123.jpg',
  width: 1920, // Optional: for images
  height: 1080, // Optional: for images
  thumbnailUrl: 'https://storage.example.com/thumbs/abc123.jpg', // Optional
});
```

### Create a Link Attachment

```typescript
const linkAttachment = await attachmentService.createLinkAttachment({
  entityType: 'note',
  entityId: noteId,
  orgId: userSession.orgId,
  userId: userSession.userId,
  url: 'https://example.com/article',
  title: 'Example Article', // Optional
  description: 'A great article about...', // Optional
  favicon: 'https://example.com/favicon.ico', // Optional
  imageUrl: 'https://example.com/preview.jpg', // Optional
});
```

### Get Attachments for an Entity

```typescript
// Get file attachments
const files = await attachmentService.getFileAttachments(
  'note',
  noteId,
  orgId
);

// Get link attachments
const links = await attachmentService.getLinkAttachments(
  'note',
  noteId,
  orgId
);
```

### Update an Attachment

```typescript
// Update file attachment (rename)
await attachmentService.updateFileAttachment(attachmentId, orgId, {
  fileName: 'new-name.jpg',
});

// Update link attachment
await attachmentService.updateLinkAttachment(attachmentId, orgId, {
  title: 'Updated Title',
  description: 'Updated description',
});
```

### Delete an Attachment

```typescript
// Delete a file attachment
await attachmentService.deleteFileAttachment(attachmentId, orgId);

// Delete a link attachment
await attachmentService.deleteLinkAttachment(attachmentId, orgId);

// Delete all attachments for an entity
await attachmentService.deleteEntityAttachments('note', noteId, orgId);
```

### Validate Before Upload

```typescript
import { validateFileUpload, validateLink } from '@vorklee2/core-attachments';

// Validate file
const file = event.target.files[0];
const validation = validateFileUpload(file, {
  width: 1920,
  height: 1080,
});

if (!validation.valid) {
  return { error: validation.error };
}

// Validate link
const linkValidation = validateLink('https://example.com');
if (!linkValidation.valid) {
  return { error: linkValidation.error };
}
```

## API Route Example

### Upload File Attachment

```typescript
// app/api/attachments/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { createAttachmentService } from '@vorklee2/core-attachments';
import { db } from '@/db/db';
import { validateFileUpload } from '@vorklee2/core-attachments';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Upload to storage (S3/R2/etc) - implement your storage logic
    const fileUrl = await uploadToStorage(file);

    // Create attachment record
    const attachmentService = createAttachmentService(db);
    const attachment = await attachmentService.createFileAttachment({
      entityType,
      entityId,
      orgId: user.orgId,
      userId: user.userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl,
    });

    return NextResponse.json(attachment);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### Create Link Attachment

```typescript
// app/api/attachments/links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@vorklee2/core-auth';
import { createAttachmentService, validateLink } from '@vorklee2/core-attachments';
import { db } from '@/db/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth();
    const body = await request.json();
    const { url, entityType, entityId, title, description } = body;

    // Validate link
    const validation = validateLink(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create attachment record
    const attachmentService = createAttachmentService(db);
    const attachment = await attachmentService.createLinkAttachment({
      entityType,
      entityId,
      orgId: user.orgId,
      userId: user.userId,
      url,
      title,
      description,
    });

    return NextResponse.json(attachment);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create link' },
      { status: 500 }
    );
  }
}
```

## Supported File Types

### Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- SVG (`image/svg+xml`)
- BMP (`image/bmp`)

### Documents
- PDF (`application/pdf`)

### Limits
- Maximum file size: 50MB
- Maximum image dimensions: 10,000 x 10,000 pixels

## TypeScript Types

```typescript
import type {
  FileAttachment,
  LinkAttachment,
  Attachment,
  CreateFileAttachmentInput,
  CreateLinkAttachmentInput,
  UpdateAttachmentInput,
  ValidationResult,
} from '@vorklee2/core-attachments';
```

## Database Schema

The module creates two tables:

- `file_attachments` - Stores file metadata
- `link_attachments` - Stores link metadata

Both tables support:
- Polymorphic entity references (`entityType` + `entityId`)
- Organization isolation (`orgId`)
- User tracking (`userId`)
- Timestamps

## License

Part of the Vorklee2 platform.

