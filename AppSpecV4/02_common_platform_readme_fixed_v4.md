---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🧠 02_Common_Platform_Readme_Fixed.md  
## Vorklee2 Future App Common Guidelines – Integrated with Core Platform (v4.0)

---

## 🧩 Purpose

This file defines the **fixed and non-editable common platform standards** that all future Vorklee2 apps must inherit.  
It establishes the foundation for security, ownership, and architecture integration across the **hybrid multi-app SaaS ecosystem**.

The rules in this document are enforced globally across all apps and are **not to be modified** without Core DevOps approval.

---

## 🚀 1. Core Architectural Assumptions

- Shared **Core Platform** manages: Authentication, Organizations, Billing, Analytics, and Audit.  
- Each app operates in its **own Neon branch** (e.g., `notes-db`, `attendance-db`).  
- Apps communicate only via **Core REST APIs** and shared packages (`@core-*`).  
- Every app contains:
  - `/db/schema.ts` – Drizzle ORM schema  
  - `/services/` – Business logic layer  
  - `/api/` – API route handlers  
  - `.env.local` – App-specific environment variables  
- Common dependencies reside in `/packages/core-*`.

---

## 🔐 2. Authentication & Session Rules

All apps must use the unified authentication middleware via `@core-auth`.

### ✅ Required Implementation
```ts
import { getUserAuth } from "@core-auth";
const { userId, orgId, session } = await getUserAuth();
```

### ❌ Deprecated Methods
Do **not** use legacy functions such as:
- `getClerkUserId()`  
- `auth()` (legacy pattern)

### Enforcement Notes
- Server must derive user identity from **validated session tokens**.  
- Never trust client-provided `userId` or `organizationId`.  
- Always validate membership and ownership before accessing data.

---

## 🧱 3. Ownership & CRUD Policy

| Operation | Rule | Enforcement Source |
|------------|------|--------------------|
| **CREATE** | `ownerId` must equal the authenticated user's UUID. | Core Policy |
| **UPDATE** | The `ownerId` field must never be modified post-creation. | Core Policy |
| **DELETE / RESTORE** | Must include valid `userId` from session for audit tracking. | Audit Layer |
| **FETCH** | Always scoped by `organizationId`. | Integration Rule |

> Frontend is **never allowed** to send `owner` or `userId` fields directly in the payload.

---

## ⚙️ 4. Error Handling Standards

All server and service layers must expose clear, traceable errors.

### Example
```ts
try {
  await db.query();
} catch (err) {
  throw new Error(`Database error: ${err.message}`);
}
```

### Rules
- Never hide or suppress the original error.  
- Log through `@core-utils/logger` → stream to **Sentry**.  
- Only include stack traces in server logs (never client).

---

## 🧩 5. Schema and Type Conventions

| Rule | Enforcement |
|------|--------------|
| Use **UUID** for all primary and foreign keys. | Drizzle ORM |
| Never use Clerk IDs or string identifiers for filtering. | Auth Layer |
| Database types must exactly match Drizzle models. | Schema Validation |
| Document any type conversions between Auth and DB IDs. | Code Comments |

### Example
```ts
ownerId: uuid("owner_id").references(() => users.id).notNull(),
organizationId: uuid("organization_id").notNull(),
```

---

## 🧭 6. API & Folder Hierarchy

### API Flow
```
Frontend → API Client → Services → Database → Response → Frontend
```

### Folder Layout (Per App)
```
apps/[app-name]/
 ├── app/
 ├── api/
 ├── db/
 │    ├── schema.ts
 │    └── db.ts
 ├── services/
 ├── lib/
 ├── .env.local
 └── package.json
```

Each service layer should interface between the API handler and database queries.

---

## 🧠 7. Security & Audit Controls

- Every mutation must trigger an event in `@core-audit`.  
- Enforce **row-level isolation** by `organizationId`.  
- Rate limiting via `@core-utils/rateLimiter`.  
- Use soft delete patterns (retain audit history).  
- Secrets and tokens must only exist in `.env.local` or CI/CD secrets.  
- **Never** store credentials or sensitive tokens in the repository.

### Privilege Escalation Protection
- Server derives all IDs from `@core-auth`.  
- Ignore any ownership identifiers passed by clients.

---

## 💾 8. Redis, Neon, and Backup Practices

| Component | Best Practice |
|------------|----------------|
| **Neon DB** | One project with branches per app |
| **Redis** | Clustered setup with daily backups |
| **PITR** | Enabled for all branches |
| **Backup Frequency** | Core: every 6h; Apps: daily |
| **S3 Export** | Encrypted, CI/CD managed |

CI pipelines must automatically sync cache and backup tasks.

---

## 🤖 9. AI-Readiness and Metadata Rules

- All app directories must follow the folder conventions in `6_common_project_folder_structure.md`.  
- AI agents should locate schema, routes, and services in predictable locations.  
- Each app must include a `metadata.json` file with module info for AI scaffolding.  
- Embed inline AI annotations in code comments where appropriate.  

Example:
```ts
// AI: Feature Context = Notes App | Module = Notes CRUD | Version = 4.0
```

---

## ✅ 10. Summary Checklist

| Category | Rule |
|-----------|------|
| Auth | Use `getUserAuth()` only |
| Ownership | Set on CREATE, never modify |
| Errors | Include full message, log via Sentry |
| Schema | UUIDs only |
| Security | Backend-derived IDs only |
| Audit | All writes logged |
| Caching | Redis + Neon PITR enabled |
| Backups | CI/CD-managed |
| AI | Metadata + folder compliance |

---

**End of File — Vorklee2 Future App Common Guidelines (v4.0)**
