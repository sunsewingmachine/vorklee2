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
  noteId: uuid("note_id").references(() => notes.id).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## ⚙️ 5. Caching Layer

The Notes App uses **Redis** for frequently accessed data.

| Use Case | Cached Data |
|-----------|--------------|
| Notes list | Paginated notes by org/user |
| Tags | Quick lookup by organization |
| Sessions | JWT validation and TTL |

```ts
import Redis from "ioredis";
export const redis = new Redis(process.env.REDIS_URL!);
```

Cache invalidation triggers automatically after note or tag changes.

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
# Database
DATABASE_URL_NOTES=postgresql://user:pass@host/notes

# Core Integration
CORE_API_URL=https://vorklee2.com/api/core

# Infrastructure
REDIS_URL=redis://user:pass@host:port

# Public URLs (client-accessible)
NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com

# Storage (for file uploads)
FILE_STORAGE_URL=https://cdn.vorklee2.com
```

---

## 🧪 12. Testing Checklist

| Category | Validation |
|-----------|-------------|
| Auth | Login → JWT → Valid session |
| CRUD | Create, update, delete notes |
| Billing | Subscription gate enforcement |
| Caching | Cache invalidation on update |
| Rate Limiting | Requests > 100/min = 429 |
| Attachments | Uploads + deletions validated |
| Analytics | `@core-analytics` logs event |

---

## ✅ Summary

The **Notes App Architecture (v4.0)** provides a secure, modular foundation aligned with the Core Platform.  
It supports isolation, scalability, and AI-assisted extensibility for upcoming modules.

---

**End of File — Notes App Architecture Blueprint (v4.0)**
