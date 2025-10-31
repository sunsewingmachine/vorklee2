Instruction to Cline/CursorAI/ChatGPT: Don't change this file, This is fixed and should be followed.
--------------------------------------------------

# 🧠 Vorklee2 Future App Common Guidelines v2.1
### Integrated with Core Platform (Auth, Billing, Neon, AI Systems)

---

## 1️⃣ Overview & Purpose

This document defines the **common development and security standards** for all **future Vorklee2 apps**, ensuring alignment with the hybrid multi-app SaaS architecture powered by **Next.js 14+, Turborepo, Drizzle ORM, and NeonDB**.

It merges the foundational principles from:
- `README-Fixed.md` (Authentication and Ownership Rules)
- `5_common_project_guidelines.md` (Architecture and DevOps Standards)
- `2_common_platform_overview_and_integration.md` (Integration Overview)

All future apps must **inherit these rules** unless an exception is explicitly documented and approved by the Core DevOps team.

---

## 2️⃣ Core Architectural Assumptions

- Shared **Core Platform** handles: Auth, Orgs, Billing, Analytics, Audit.
- Each app operates in its **own Neon branch** (e.g. `tasks-db`, `notes-db`).
- Apps connect via REST APIs to the Core Platform.
- Each app includes:
  - `/db/schema.ts` — Drizzle ORM schema
  - `/services/` — Business logic layer
  - `/api/` — Route handlers
  - `.env.local` — Environment variables per branch
- Common packages available via `packages/core-*`.

---

## 3️⃣ Authentication & Session Rules

### ✅ Required Pattern

Use the **modern Vorklee2 authentication layer** via `@core-auth`:

```ts
import { getUserAuth } from '@core-auth';
const { userId, orgId, session } = await getUserAuth();
```

### ❌ Deprecated Methods
Do **not** use:
- `getClerkUserId()`
- `auth()` (legacy pattern)

### 🧩 Integration

- The **server determines user identity** from the session.
- Never trust **client-provided user or owner IDs**.
- Always validate organization membership before data access.

---

## 4️⃣ Ownership & CRUD Policies

| Operation | Rule | Source |
|------------|------|--------|
| CREATE | The `owner` field = current authenticated user's UUID | README-Fixed.md |
| UPDATE | Never modify the `owner` field | README-Fixed.md |
| DELETE / RESTORE | Must include `userId` (from session) for auditing | README-Fixed.md |
| FETCH | Scoped by `organizationId` | Common Integration Guide |

**Note:** Never allow the frontend to pass `owner` or `userId` in the body.

---

## 5️⃣ Error Handling Rules

Always throw errors with the **original error message** included:

```ts
try {
  // logic
} catch (err) {
  throw new Error(`Database error: ${err.message}`);
}
```

### Guidelines
- Never suppress or overwrite error messages without logging.
- Log through `@core-utils/logger` and stream to **Sentry**.
- Include stack traces only in server logs, not client responses.

---

## 6️⃣ Type Safety & Schema Conventions

| Rule | Enforcement |
|------|--------------|
| Use **UUID** for all user, org, and task IDs | Database schema |
| Never use Clerk ID or string for DB filtering | Auth rules |
| Match database field types strictly with Drizzle models | Type safety |
| Document conversions between Clerk IDs and DB UUIDs | Code comments |

### Example (schema.ts)
```ts
ownerId: uuid('owner_id').references(() => users.id).notNull(),
organizationId: uuid('organization_id').notNull(),
```

---

## 7️⃣ API Flow & Folder Standards

### API Flow

```
Front End
 → API Client Layer (src/api-client)
 → Server-side Services (src/services)
 → Database Layer (Drizzle)
 → Back to API Client
 → Front End Response
```

### Folder Structure (per app)

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

### Task/Entity Hierarchy Example
```
Organization → Folder → Project (+ Category) → Task → SubTask
```

---

## 8️⃣ Security & Audit Integration

- Every write operation triggers a **Core Audit event** via `@core-audit`.
- JWT-based authentication ensures **row-level isolation** (`organizationId`).
- **Rate limiting** enforced via `@core-utils/rateLimiter`.
- **Soft Delete / Restore** functions must include `userId` context.
- All env secrets managed in CI/CD or `.env.local`, never committed.

### Privilege Escalation Prevention
- Server derives `userId` and `orgId` from session context.
- Never accept any ownership identifiers from the frontend.

---

## 9️⃣ Redis, Neon, and Backup Practices

| Component | Best Practice |
|------------|----------------|
| Neon DB | One project → multiple branches per app |
| Redis | Clustered setup with daily backups |
| PITR | Enabled per branch |
| Backup Frequency | Core: every 6h, Apps: daily |
| S3 Exports | Encrypted snapshots |

Ensure that cache and DB restoration scripts are mirrored in CI/CD pipelines.

---

## 🔟 AI-Readiness and Automation

- Embed **AI metadata** for automated validation and scaffolding.
- Ensure folders follow the **AI-consumable layout** from `4_common_project_folder_structure_instructions.md`.
- Allow AI agents (e.g., Cline/CursorAI) to access schema, routes, and services easily.
- Document exceptions explicitly for AI code generation clarity.

---

## ✅ 1️⃣1️⃣ Summary Checklist

| Category | Rule |
|-----------|------|
| Auth | Use `getUserAuth()` only |
| Owner | Set only on CREATE |
| Errors | Include original message |
| Schema | Use UUIDs |
| Security | Never trust frontend IDs |
| Audit | All write ops logged |
| Cache | Redis clustered + daily backup |
| DB | Neon branch per app |
| AI | Maintain metadata conventions |

---

**End of File — Vorklee2 Future App Common Guidelines v2.1**
