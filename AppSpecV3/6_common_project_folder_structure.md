# 🗂️ Vorklee2 Project Folder Structure Instructions (AI-Ready)

This document defines the **official folder structure** for the Vorklee2 multi-app SaaS ecosystem.  
All AI tools and developers must follow this structure exactly when generating code or placing files.

---

## 1️⃣ Overview

Vorklee2 is a **hybrid multi-app SaaS platform** with:
- One **shared Core Platform** (auth, orgs, billing)
- Multiple **independent apps** (Notes, Attendance, HR, etc.)
- A **shared packages workspace** for reusable modules

It uses a **Turborepo-style monorepo layout**.

---

## 2️⃣ Root Folder Layout

```
vorklee2/
├── apps/
│   ├── core/
│   │   ├── app/
│   │   ├── api/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── db.ts
│   │   ├── services/
│   │   ├── lib/
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── notes/
│   │   ├── app/
│   │   ├── api/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── db.ts
│   │   ├── services/
│   │   ├── lib/
│   │   │   └── validations/
│   │   │       └── notes.ts
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── attendance/
│   │   ├── db/
│   │   ├── services/
│   │   ├── .env.local
│   │   └── package.json
│   │
│   └── hr/
│       ├── db/
│       ├── .env.local
│       └── package.json
│
├── packages/
│   ├── core-auth/
│   ├── core-users/
│   ├── core-orgs/
│   ├── core-billing/
│   ├── core-settings/
│   ├── core-notifications/
│   ├── core-utils/
│   ├── core-analytics/
│   ├── core-audit/
│   └── core-features/
│
├── infra/
│   ├── ci/
│   │   └── github-actions/
│   ├── docker/
│   ├── backup/
│   └── neon/
│
├── .gitignore
├── turbo.json
├── package.json
└── README.md
```

---

## 3️⃣ Environment Variable Placement Rules

Each app should have its own `.env.local`.

| File | Scope | Example Variables |
|------|--------|------------------|
| `apps/core/.env.local` | Core Platform | `DATABASE_URL_CORE`, `STRIPE_SECRET`, `CLERK_SECRET_KEY` |
| `apps/notes/.env.local` | Notes App | `DATABASE_URL_NOTES`, `CORE_API_URL` |
| `apps/attendance/.env.local` | Attendance App | `DATABASE_URL_ATTENDANCE`, `CORE_API_URL` |
| `apps/hr/.env.local` | HR App | `DATABASE_URL_HR`, `CORE_API_URL` |

---

## 4️⃣ Shared Packages Responsibilities

| Package | Purpose |
|----------|----------|
| `@core-auth` | JWT / Clerk integration |
| `@core-users` | Global users CRUD |
| `@core-orgs` | Org management |
| `@core-billing` | Stripe billing |
| `@core-utils` | Common utilities |
| `@core-analytics` | Usage tracking |
| `@core-audit` | Data-change tracking |
| `@core-settings` | Global settings |

---

## 5️⃣ Database File Placement

Each app has its own schema and DB client inside `/db`.

| App | File Path | Purpose |
|------|------------|----------|
| Core | `apps/core/db/schema.ts` | Core entities |
| Notes | `apps/notes/db/schema.ts` | Notes data |
| Attendance | `apps/attendance/db/schema.ts` | Attendance data |
| HR | `apps/hr/db/schema.ts` | HR data |

---

## 6️⃣ Drizzle DB Setup

Each `db.ts` uses its app’s Neon branch connection string:

```ts
import { drizzle } from "drizzle-orm/neon-http";
export const db = drizzle(process.env.DATABASE_URL_*!);
```

Replace `*` with `CORE`, `NOTES`, etc.

---

## 7️⃣ API Routes Pattern

```
app/api/
 ├── [resource]/route.ts
 ├── [resource]/[id]/route.ts
 └── auth/
```

---

## 8️⃣ Integration Rules

- Apps use Core APIs for auth, billing, and org data.  
- Apps never directly touch the Core DB.  
- Shared logic comes from `packages/core-*`.

---

## ✅ Summary

This folder structure ensures:
- Modular separation per app  
- Clean `.env` isolation  
- AI-friendly monorepo organization  

Follow this layout exactly when scaffolding the project.

---

**End of File – vorklee2_project_folder_structure_instructions.md**
