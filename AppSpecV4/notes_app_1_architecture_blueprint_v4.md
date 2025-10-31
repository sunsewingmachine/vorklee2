---
version: "4.0"
maintainer: "Vorklee2 DevOps / App Engineering Team"
last_updated: "auto"
type: "app"
app_name: "Notes"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🧠 Notes_App_1_Architecture_Blueprint.md  
## Notes App Technical Architecture Blueprint – Integrated with Core Platform (v4.0)

---

## 🧭 1. Purpose

This document defines the **technical and architectural design** of the Notes App, a modular component of the **Vorklee2 Hybrid Multi-App SaaS Platform**.  
It describes database design, API flow, caching, and integration points with the shared **Core Platform** (Auth, Billing, Orgs, and Analytics).

---

## 🧩 2. Dependencies and Imports

The Notes App relies on shared Core packages for cross-platform consistency:

| Package | Purpose |
|----------|----------|
| `@core-auth` | JWT-based session and middleware |
| `@core-billing` | Subscription and plan validation |
| `@core-orgs` | Organization and user management |
| `@core-utils` | Logging, error handling, and rate limiting |
| `@core-audit` | Audit trail for all mutations |

---

## 🧱 3. System Flow Overview

```
+-----------------------------+
| 1️⃣  User logs in via Core     |
+-----------------------------+
              |
              v
+-----------------------------+
| 2️⃣  JWT verified by Notes App |
|     via @core-auth middleware |
+-----------------------------+
              |
              v
+-----------------------------+
| 3️⃣  Subscription validated     |
|     via @core-billing          |
+-----------------------------+
              |
              v
+-----------------------------+
| 4️⃣  CRUD actions in Notes DB  |
|     (Drizzle + Neon branch)   |
+-----------------------------+
              |
              v
+-----------------------------+
| 5️⃣  Analytics & Audit events  |
|     logged via Core APIs      |
+-----------------------------+
```

---

## 🧮 4. Database Schema (Drizzle ORM)

```ts
// apps/notes/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  platformUserId: uuid("platform_user_id"),
  email: text("email").notNull(),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  notebookId: uuid("notebook_id"),
  createdBy: uuid("created_by").references(() => appUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isArchived: boolean("is_archived").default(false),
});

export const notebooks = pgTable("notebooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
});

export const noteTags = pgTable("note_tags", {
  noteId: uuid("note_id").references(() => notes.id).notNull(),
  tagId: uuid("tag_id").references(() => tags.id).notNull(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "cascade" }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Database Indexes

For optimal query performance, the following indexes should be created:

```sql
-- Composite index for organization-scoped queries
CREATE INDEX idx_notes_org_created ON notes(organization_id, created_at DESC);
CREATE INDEX idx_notes_org_updated ON notes(organization_id, updated_at DESC);
CREATE INDEX idx_notes_org_notebook ON notes(organization_id, notebook_id) WHERE notebook_id IS NOT NULL;
CREATE INDEX idx_notes_org_archived ON notes(organization_id, is_archived) WHERE is_archived = false;

-- Indexes for notebooks
CREATE INDEX idx_notebooks_org ON notebooks(organization_id);

-- Indexes for tags
CREATE INDEX idx_tags_org ON tags(organization_id);
CREATE INDEX idx_tags_org_name ON tags(organization_id, name);

-- Indexes for note_tags junction table
CREATE INDEX idx_note_tags_note ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);

-- Indexes for attachments
CREATE INDEX idx_attachments_note ON attachments(note_id);

-- Indexes for app_users
CREATE INDEX idx_app_users_org ON app_users(organization_id);
CREATE INDEX idx_app_users_platform_user ON app_users(platform_user_id) WHERE platform_user_id IS NOT NULL;
```

### Foreign Key Cascade Rules

All foreign keys use appropriate cascade behaviors:
- `notes.created_by` → `app_users.id`: No cascade (preserve notes if user deleted)
- `notes.notebook_id` → `notebooks.id`: No cascade (preserve notes if notebook deleted)
- `note_tags.note_id` → `notes.id`: `CASCADE` (delete tags when note deleted)
- `note_tags.tag_id` → `tags.id`: `CASCADE` (delete junction when tag deleted)
- `attachments.note_id` → `notes.id`: `CASCADE` (delete attachments when note deleted)

### Soft Delete Pattern

The schema implements soft deletes using the `isArchived` boolean field:
- Soft delete: Set `isArchived = true`
- Hard delete: Actually remove record (for compliance/GDPR)
- Queries filter `isArchived = false` by default
- Archived records retained for audit/compliance purposes

```

---

## ⚙️ 5. Caching Layer

The Notes App uses **Redis** for frequently accessed data following the **cache-aside pattern**.

### Cache Strategy

| Use Case | Cached Data | TTL | Cache Key Pattern |
|-----------|--------------|-----|-------------------|
| Notes list | Paginated notes by org/user | 5 minutes | `notes:list:{orgId}:{page}:{limit}` |
| Single note | Full note data | 10 minutes | `notes:detail:{orgId}:{noteId}` |
| Tags | Quick lookup by organization | 30 minutes | `tags:list:{orgId}` |
| Notebooks | Notebook list by organization | 15 minutes | `notebooks:list:{orgId}` |
| Sessions | JWT validation and TTL | Session duration | `session:{token}` |

### Cache Key Naming Convention

All cache keys follow this pattern: `{app}:{resource}:{orgId}:{identifier}`

Examples:
- `notes:list:550e8400-e29b-41d4-a716-446655440000:1:20`
- `notes:detail:550e8400-e29b-41d4-a716-446655440000:660e8400-e29b-41d4-a716-446655440001`
- `tags:list:550e8400-e29b-41d4-a716-446655440000`

### Cache Implementation

```ts
import { getRedisClient, cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from "@core-utils";

// Cache-aside pattern for reads
async function getNotesWithCache(orgId: string, page: number, limit: number) {
  const cacheKey = `notes:list:${orgId}:${page}:${limit}`;
  
  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;
  
  // Cache miss - fetch from DB
  const notes = await db.select().from(notes).where(...);
  
  // Store in cache with TTL
  await cacheSet(cacheKey, notes, { ttl: 300 }); // 5 minutes
  
  return notes;
}

// Cache invalidation on writes
async function createNote(orgId: string, data: NoteInput) {
  const note = await db.insert(notes).values(data).returning();
  
  // Invalidate related caches
  await cacheDeletePattern(`notes:list:${orgId}:*`);
  await cacheDelete(`tags:list:${orgId}`);
  
  return note;
}
```

### Cache Invalidation Triggers

Cache invalidation occurs automatically on:
- **Note mutations**: Invalidates `notes:list:*` and `notes:detail:{noteId}`
- **Tag mutations**: Invalidates `tags:list:{orgId}`
- **Notebook mutations**: Invalidates `notebooks:list:{orgId}` and related note lists
- **Attachment operations**: Invalidates `notes:detail:{noteId}`

**Invalidation Strategy:**
- Use pattern matching (`cacheDeletePattern`) for list caches
- Use specific keys for detail caches
- TTL serves as backup for stale data

---

## 🧩 6. Rate Limiting Middleware

To prevent abuse and ensure tenant fairness:

```ts
import { rateLimiter } from "@core-utils/rateLimiter";

export const limiter = rateLimiter({
  points: 100, // max 100 requests
  duration: 60 // per minute
});
```

Applied to `/api/notes/*` routes.

---

## 🧭 7. Folder Structure

```
apps/notes/
  ├── app/                  → UI components (App Router)
  ├── api/                  → REST endpoints
  ├── db/                   → Schema + Drizzle config
  ├── services/             → Core business logic
  ├── lib/                  → Validation, helpers
  │    └── validations/
  │         └── notes.ts
  ├── layout.tsx
  ├── middleware.ts
  ├── .env.local
  └── package.json
```

---

## 🧠 8. API Routes

### REST Endpoints
```
/api/notes [GET, POST]
/api/notes/:id [GET, PATCH, DELETE]
/api/tags [GET, POST]
/api/notebooks [GET, POST]
/api/attachments [POST, DELETE]
```

### Example Handler
```ts
import { verifySession } from "@core-auth";
import { checkSubscription } from "@core-billing";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const { orgId } = await verifySession(token);
  await checkSubscription(orgId, "notes");
  const body = await req.json();
  const note = await notesService.createNoteForOrg(orgId, body);
  return NextResponse.json(note, { status: 201 });
}
```

---

## 🎨 9. UI Layer and Design

- Built using **Material UI v7**.  
- Integrated with the global shared theme.  
- Uses **TanStack Query** for caching and fetch states.  
- Features:
  - Markdown Editor with live preview.  
  - Notebook + Tag sidebar.  
  - AI Summarization (via `@core-ai`, planned).  
  - “Your Plan” tab integrated with `@core-billing`.

---

## 🧾 10. Security & Compliance

| Policy | Enforcement |
|--------|--------------|
| Isolation | `organizationId` for all DB records |
| Auth | JWT verified via `@core-auth` |
| Rate Limiting | `@core-utils/rateLimiter` |
| Logging | `@core-audit` for all mutations |
| File Validation | MIME type + file size checks |
| Storage | CDN or S3 (not DB BLOBs) |

---

## 🧩 11. Environment Variables

All environment variables follow the **Vorklee2 naming standards** (see `04_Common_Platform_Overview_and_Integration.md`).

```bash
# Database (Required)
DATABASE_URL_NOTES=postgresql://user:pass@host/notes

# Core Integration (Required)
CORE_API_URL=https://vorklee2.com/api/core

# Infrastructure (Required)
REDIS_URL=redis://user:pass@host:port

# Public URLs (client-accessible, Required)
NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com

# Storage (for file uploads, Optional)
FILE_STORAGE_URL=https://cdn.vorklee2.com

# Environment validation on startup (Optional, defaults to strict)
VALIDATE_ENV=true
```

### Environment Variable Validation

All apps must validate required environment variables on startup:

```ts
// lib/env-validation.ts
import { getEnvVar } from "@core-utils";

export function validateEnv() {
  const required = [
    "DATABASE_URL_NOTES",
    "CORE_API_URL",
    "REDIS_URL",
    "NEXT_PUBLIC_APP_URL"
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
```

---

## 🗄️ 12. Database Migrations

### Migration Strategy

Database schema changes are managed using **Drizzle Kit** with versioned migrations.

### Migration Naming Convention

Migrations follow this pattern: `{timestamp}_{description}.sql`

Examples:
- `20240101000000_initial_schema.sql`
- `20240115000000_add_notebook_color.sql`
- `20240201000000_add_note_pinned_field.sql`

### Migration Process

1. **Development:**
   ```bash
   # Generate migration from schema changes
   npm run db:generate
   
   # Apply migration to development database
   npm run db:migrate
   ```

2. **Staging/Production:**
   ```bash
   # Migrations run automatically via CI/CD before deployment
   npm run db:migrate
   ```

### Migration Best Practices

- **Always review generated migrations** before applying
- **Never modify existing migrations** - create new ones for fixes
- **Test migrations on staging** before production
- **Backup database** before running migrations in production
- **Zero-downtime migrations**: Use additive changes (add columns, not remove)
- **Rollback strategy**: Maintain rollback scripts for critical migrations

### Zero-Downtime Migration Guidelines

For production deployments, follow these patterns:

1. **Additive Changes:**
   - Add new columns with `DEFAULT` values (nullable if needed)
   - Add new indexes concurrently (`CREATE INDEX CONCURRENTLY`)
   - Add new tables

2. **Schema Changes:**
   - Split into multiple deployments (add → migrate data → remove old)
   - Avoid dropping columns until all code references are removed

3. **Data Migrations:**
   - Run in batches for large tables
   - Use background jobs for time-consuming operations

### Rollback Procedures

Critical migrations must include rollback scripts:

```sql
-- Migration: add_note_pinned_field.sql
ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- Rollback: remove_note_pinned_field.sql
ALTER TABLE notes DROP COLUMN is_pinned;
```

---

## 🧪 13. Testing Checklist

| Category | Validation |
|-----------|-------------|
| Auth | Login → JWT → Valid session |
| CRUD | Create, update, delete notes |
| Billing | Subscription gate enforcement |
| Caching | Cache invalidation on update |
| Rate Limiting | Requests > 100/min = 429 |
| Attachments | Uploads + deletions validated |
| Analytics | `@core-analytics` logs event |
| Migrations | Schema changes applied correctly |
| Indexes | Query performance meets targets |
| Environment | All required env vars validated |

---

## ✅ Summary

The **Notes App Architecture (v4.0)** provides a secure, modular foundation aligned with the Core Platform.  
It supports isolation, scalability, and AI-assisted extensibility for upcoming modules.

**Key Improvements in v4.0:**
- Comprehensive database indexing strategy
- Detailed caching layer with invalidation patterns
- Migration management and zero-downtime deployment guidelines
- Environment variable validation on startup
- Soft delete pattern documentation
- Foreign key cascade rules specification

---

**End of File — Notes App Architecture Blueprint (v4.0)**
