### Index: 3 of 4 — Notes App Architecture Blueprint (Hybrid SaaS Model)
# 🧠 Notes App Architecture v2 – Integrated with Shared Core Platform

This file defines the **technical and architectural blueprint** for the Notes App, built atop the shared SaaS platform defined in `1_common_modules_blueprint_v2.md` and integrated through the environment described in `2_platform_overview_and_integration_v2.md`.

It includes database schema, caching, middleware, API design, and ASCII-style diagrams for system flow.

---

## 1️⃣ Purpose

The Notes App enables users and organizations to manage structured, collaborative note-taking within a secure, scalable SaaS environment.  
It reuses common modules from the shared Core (auth, billing, orgs, analytics) but operates its own independent database.

---

## 2️⃣ Dependencies

The app imports and depends on the following shared modules:
- `@core-auth` — handles JWT sessions and middleware
- `@core-billing` — checks subscription status
- `@core-orgs` — provides organization data
- `@core-utils` — provides helpers (DB connection, logging, rate limiter)
- `@core-audit` — records all write actions

---

## 3️⃣ High-Level Flow Diagram

```
+-----------------------------+
| 1️⃣  User logs in via Core     |
+-----------------------------+
              |
              v
+-----------------------------+
| 2️⃣  JWT verified by Notes App |
|    via @core-auth middleware |
+-----------------------------+
              |
              v
+-----------------------------+
| 3️⃣  Subscription verified     |
|     via @core-billing        |
+-----------------------------+
              |
              v
+-----------------------------+
| 4️⃣  CRUD operations executed |
|     in Notes App DB         |
+-----------------------------+
              |
              v
+-----------------------------+
| 5️⃣  Analytics + Audit logged |
|     via @core-analytics      |
+-----------------------------+
```

---

## 4️⃣ Database Schema (Drizzle ORM)

```ts
// Users specific to Notes App (mapped to org + core user)
export const appUsers = pgTable('app_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  platformUserId: uuid('platform_user_id'),
  email: text('email').notNull(),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notes table
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  notebookId: uuid('notebook_id').nullable(),
  createdBy: uuid('created_by').references(() => appUsers.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isArchived: boolean('is_archived').default(false),
});

// Notebooks table
export const notebooks = pgTable('notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description').nullable(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tags and relations
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
});

export const noteTags = pgTable('note_tags', {
  noteId: uuid('note_id').references(() => notes.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
});

// Attachments table
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').references(() => notes.id).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  size: integer('size'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 5️⃣ Caching Layer

The Notes App uses **Redis** for:
- Frequently fetched note lists
- Tag and notebook lookups
- Session token validation cache

```ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

When a note is created or updated, cache entries for the org are invalidated automatically.

---

## 6️⃣ Rate Limiting Middleware

To prevent abuse:
```ts
import { rateLimiter } from '@core-utils/rateLimiter';

export const limiter = rateLimiter({
  points: 100,
  duration: 60, // 100 requests per minute per IP/org
});
```

Applied at `/api/notes/*` endpoints.

---

## 7️⃣ Folder Structure

```
apps/notes/
  db/
    schema.ts
    db.ts
  services/
    notes.service.ts
    notebooks.service.ts
    tags.service.ts
    attachments.service.ts
  lib/
    validations/
      notes.ts
  app/
    api/
      notes/
        route.ts
        [id]/route.ts
      notebooks/
      tags/
      attachments/
    dashboard/
      notes/page.tsx
      notebooks/page.tsx
      tags/page.tsx
  layout.tsx
  middleware.ts
```

---

## 8️⃣ API Design

### Routes
```
/api/notes [GET, POST]
/api/notes/:id [GET, PATCH, DELETE]
/api/tags [GET, POST]
/api/notebooks [GET, POST]
/api/attachments [POST, DELETE]
```

### Example Handler
```ts
import { verifySession } from '@core-auth';
import { checkSubscription } from '@core-billing';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const { orgId } = await verifySession(token);
  await checkSubscription(orgId, 'notes');
  const body = await req.json();
  const note = await notesService.createNoteForOrg(orgId, body);
  return NextResponse.json(note, { status: 201 });
}
```

---

## 9️⃣ UI Layer

- **Material UI v7** for theming and layout  
- **TanStack Query** for async data and caching  
- Sidebar navigation: Notebooks, Tags, Search  
- Markdown editor with auto-save and AI summarization hooks  
- Responsive grid layout for notes list  
- “Your Plan” tab integrates with `@core-billing`

---

## 🔟 Example Data Flow (ASCII Diagram)

```
User → Login → Core Auth → JWT → Notes API
  ↓                              |
  ↓                              v
  Notes Service (verify org & plan) → Notes DB
  ↓                              |
  ↓                              v
  Analytics + Audit Log → Core DB
```

---

## 1️⃣1️⃣ Security & Compliance

- Row-level isolation via `organizationId`
- JWT validation on every API route
- Rate limit enforcement via Redis
- Audit logs recorded for every mutation
- File uploads validated by MIME + size
- No direct file storage in DB (S3 URL references only)

---

## 1️⃣2️⃣ Environment Variables
```
DATABASE_URL_NOTES=postgresql://user:pass@host:port/notes
CORE_API_URL=https://your-platform.com/api/core
REDIS_URL=redis://user:pass@host:port
NEXT_PUBLIC_APP_URL=https://notes.your-platform.com
FILE_STORAGE_URL=https://cdn.your-platform.com
```

---

## 1️⃣3️⃣ Testing Checklist

| Test Area | Description |
|------------|-------------|
| Auth | Login → JWT → Session valid |
| CRUD | Create / Read / Update / Delete note |
| Billing | Subscription validation |
| Caching | Cached list invalidates correctly |
| Rate Limiting | Requests > threshold return 429 |
| Attachments | Uploads + deletes handled properly |
| Analytics | Audit log entries created |

---

**End of File – 3_notes_app_architecture_blueprint_v2.md**
