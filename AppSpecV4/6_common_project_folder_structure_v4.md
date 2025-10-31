---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🗂️ 06_Common_Project_Folder_Structure.md  
## Vorklee2 Monorepo Folder Structure & Organization (v4.0)

---

## 🧭 Purpose

This document defines the **official Turborepo folder structure** for the Vorklee2 Multi-App SaaS ecosystem.  
It serves as the **source of truth** for both developers and AI systems when generating, placing, or analyzing project files.

Consistency in structure ensures scalability, modularization, and AI-assisted navigation.

---

## 🧱 1. Overview

Vorklee2 is a **hybrid multi-app monorepo**, consisting of:
- One **shared Core Platform** (`apps/core`)  
- Multiple **App Modules** (e.g., Notes, Attendance, HR, etc.)  
- Shared **Core Packages** (`packages/core-*`)  
- Centralized **Infrastructure Layer** (`infra/`)  

The structure is optimized for **Next.js 14+, Turborepo, and NeonDB**.

---

## 🧩 2. Root Directory Layout

```
vorklee2/
├── apps/
│   ├── core/               → Core Platform (auth, orgs, billing)
│   ├── notes/              → Notes App Module
│   ├── attendance/         → Attendance App Module
│   └── hr/                 → HR App Module (future)
│
├── packages/
│   ├── core-auth/          → Authentication layer
│   ├── core-orgs/          → Org management
│   ├── core-billing/       → Billing & subscriptions
│   ├── core-settings/      → System and org settings
│   ├── core-analytics/     → Usage analytics
│   ├── core-audit/         → Compliance and mutation tracking
│   ├── core-utils/         → Shared utilities and helpers
│   ├── core-notifications/ → Notifications and emails
│   └── core-features/      → Feature flags and entitlement logic
│
├── infra/
│   ├── ci/github-actions/  → CI/CD pipeline definitions
│   ├── docker/             → Docker images and configs
│   ├── backup/             → Backup automation scripts
│   └── neon/               → Neon configuration and connection templates
│
├── turbo.json              → Turborepo build orchestration
├── package.json            → Monorepo dependency manager
├── README.md               → Root documentation entry
└── .gitignore
```

---

## ⚙️ 3. App Directory Standards

Each app under `/apps` must maintain this structure:

```
apps/[app-name]/
 ├── app/                  → UI (App Router components, pages, layout)
 ├── api/                  → Route handlers (REST / Next.js API routes)
 ├── db/                   → Database schema + Drizzle client
 │    ├── schema.ts
 │    └── db.ts
 ├── services/             → Business logic (Core integration)
 ├── lib/                  → Validation, utility, and helper functions
 │    └── validations/     → Zod/Yup schemas for form validation
 ├── .env.local            → Environment configuration per branch
 ├── next.config.js        → App-specific configuration
 └── package.json
```

### Notes
- Each app connects to its **own Neon branch**.  
- Cross-app communication occurs only via **Core APIs**.  
- Never share database connections between apps.

---

## 🧠 4. Environment Variable Placement

Each app has its own `.env.local` file:

| File | Scope | Key Examples |
|------|--------|--------------|
| `apps/core/.env.local` | Core Platform | `DATABASE_URL_CORE`, `STRIPE_SECRET`, `JWT_SECRET` |
| `apps/notes/.env.local` | Notes App | `DATABASE_URL_NOTES`, `CORE_API_URL` |
| `apps/attendance/.env.local` | Attendance App | `DATABASE_URL_ATTENDANCE`, `CORE_API_URL` |
| `apps/hr/.env.local` | HR App | `DATABASE_URL_HR`, `CORE_API_URL` |

All environment files are ignored by Git and stored securely in CI/CD.

---

## 🧩 5. Shared Package Responsibilities

| Package | Purpose |
|----------|----------|
| `@core-auth` | Authentication, JWT validation |
| `@core-orgs` | Organization CRUD and invites |
| `@core-billing` | Stripe / LemonSqueezy billing integrations |
| `@core-settings` | Global and org-level configurations |
| `@core-analytics` | Logs usage events |
| `@core-audit` | Tracks all write operations |
| `@core-utils` | Utilities (logger, rateLimiter, env helpers) |
| `@core-notifications` | Email, push, and system alerts |
| `@core-features` | Dynamic feature gating per subscription |

These packages must always export clean, typed APIs and avoid direct DB access unless Core-controlled.

---

## 🧰 6. Database File Standards

| App | Path | Description |
|------|------|-------------|
| Core | `apps/core/db/schema.ts` | Core tables (auth, billing, orgs) |
| Notes | `apps/notes/db/schema.ts` | Notes app tables |
| Attendance | `apps/attendance/db/schema.ts` | Attendance data |
| HR | `apps/hr/db/schema.ts` | HR data |

Each `db.ts` file connects via Drizzle ORM using its branch-specific URL:

```ts
import { drizzle } from "drizzle-orm/neon-http";
export const db = drizzle(process.env.DATABASE_URL_*!);
```

Replace `*` with the correct app name (e.g., `NOTES`, `CORE`).

---

## 🌐 7. API Route Conventions

```
app/api/
 ├── [resource]/route.ts
 ├── [resource]/[id]/route.ts
 └── auth/
```

Every route:
- Must validate `organizationId` and `userId`.  
- Must log write operations via `@core-audit`.  
- Should respect rate limiting (`@core-utils/rateLimiter`).

---

## 🧩 8. Integration & Modular Rules

- Apps depend only on Core APIs for auth, billing, and orgs.  
- Shared logic resides exclusively in `packages/core-*`.  
- Each module may register its menu and settings tab dynamically in the dashboard shell (`/core/config/modules.ts`).  
- Avoid circular dependencies between packages.  

---

## 🤖 9. AI-Readiness Guidelines

To ensure AI agents (ChatGPT, CursorAI, Vorklee Assist) can navigate and generate code accurately:

1. Maintain **consistent folder names and hierarchy**.  
2. Include **metadata comments** in services and schema files.  
   ```ts
   // AI: Module = Notes App | Version = 4.0 | Context = CRUD Service
   ```
3. Each module should export a `metadata.json` file:
   ```json
   {
     "app": "notes",
     "version": "4.0",
     "features": ["notes", "tags", "attachments"]
   }
   ```
4. Avoid nesting unrelated folders — shallow structure improves AI comprehension.

---

## ✅ 10. Summary

This folder structure guarantees:
- Predictable monorepo organization  
- Modular, isolated development per app  
- Consistent environment and deployment standards  
- AI-friendly structure for automation and code generation  

Always follow this file to scaffold new modules or assist AI-driven generation tasks.

---

**End of File — Vorklee2 Project Folder Structure (v4.0)**
