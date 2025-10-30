### Index: 1 of 4 — Common Modules Blueprint (Shared Platform Core).
# 🧩 Common Modules Blueprint v2 – Enterprise Hybrid Multi-App SaaS Platform

This file defines the **shared platform core** that powers all applications within the ecosystem (Notes, Attendance, HR, CRM, etc.).  
It is the **foundation layer** responsible for identity, authentication, organizations, billing, analytics, auditing, and communication.

---

## 1️⃣ Overview and Design Philosophy

### Purpose
To provide a **single, reusable core system** that handles shared concerns for all apps.

### Core Architecture Principle
> “Shared identity and billing — independent app logic and databases.”

This ensures:
- All apps (e.g., Notes, Attendance) use **one consistent authentication and billing model**.  
- Each app maintains its **own data schema and scalability path**.

---

## 2️⃣ Core Database Structure

The Core DB stores **organization-wide data**, app metadata, and subscription info.  
All app databases reference the `organizationId` issued by the Core.

### Tables

#### `organizations`
Stores company or team details.
```ts
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  domain: text('domain').unique(),
  ownerEmail: text('owner_email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### `apps`
Stores metadata for each registered app in the ecosystem.
```ts
export const apps = pgTable('apps', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g. 'notes', 'attendance'
  name: text('name').notNull(),
  description: text('description'),
});
```

#### `subscriptions`
Tracks which organization has access to which app and plan.
```ts
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  appId: uuid('app_id').references(() => apps.id).notNull(),
  planCode: text('plan_code').notNull(),
  status: text('status').default('active'),
  startedAt: timestamp('started_at').defaultNow(),
  expiresAt: timestamp('expires_at').nullable(),
});
```

#### `plan_features`
Defines the limits and features per plan for automation and AI gating.
```ts
export const planFeatures = pgTable('plan_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  planCode: text('plan_code').notNull(),
  feature: text('feature').notNull(),
  limitValue: integer('limit_value').nullable(),
});
```

#### `global_users`
Holds identity for all registered users across organizations.
```ts
export const globalUsers = pgTable('global_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  role: text('role').default('org_admin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 3️⃣ Core Packages and Responsibilities

| Package | Description | Example Import |
|----------|--------------|----------------|
| `@core-auth` | Handles login, JWT/session, and middleware | `import { verifySession } from '@core-auth'` |
| `@core-users` | CRUD for global users | `import { getUserByEmail } from '@core-users'` |
| `@core-orgs` | Org management and invites | `import { listOrgs } from '@core-orgs'` |
| `@core-billing` | Stripe/LemonSqueezy subscriptions | `import { getSubscriptionStatus } from '@core-billing'` |
| `@core-settings` | App and org-level settings | `import { getSetting } from '@core-settings'` |
| `@core-notifications` | Email and in-app notifications | `import { sendEmail } from '@core-notifications'` |
| `@core-analytics` | Logs usage and performance events | `import { logEvent } from '@core-analytics'` |
| `@core-audit` | Tracks all mutations for compliance | `import { recordAudit } from '@core-audit'` |
| `@core-utils` | Helpers, logging, env, and DB utilities | `import { db } from '@core-utils'` |

---

## 4️⃣ Authentication Flow

1. User logs in via Core (`/api/core/auth/login`).  
2. Core validates credentials in `global_users`.  
3. Core issues JWT with `{ userId, orgId, appCode, exp }`.  
4. Each app verifies token using `@core-auth.verifySession`.  
5. App looks up local user record (`app_users`) and applies permissions.

---

## 5️⃣ Rate Limiting and Security Controls

- Global rate limiter via Redis (`core-utils/rateLimiter.ts`)  
- JWT includes `orgId`, `appCode`, and TTL  
- Cookies: `httpOnly`, `secure`, `sameSite=lax`  
- Cross-app auth enforced via signed JWT  
- All actions audited (`core-audit`)  
- Secrets isolated in `.env`  

---

## 6️⃣ API Gateway (Future)

Planned module: **`core-gateway`**  
Acts as a unified proxy for inter-app requests and external APIs.  
Supports routing rules, caching, and service discovery.

---

## 7️⃣ Monitoring and Observability

| Tool | Purpose |
|------|----------|
| **PostHog** | Usage analytics |
| **Sentry** | Error tracking |
| **UptimeRobot** | Availability monitoring |
| **Grafana / Neon metrics** | DB health and latency |

---

## 8️⃣ Scaling Strategy

- DB: Neon or Supabase (core schema only)
- Cache: Redis for sessions
- Queue: BullMQ for async tasks
- Backup: PITR and daily snapshots
- Horizontal API scaling via Vercel or container clusters

---

**End of File – 1_common_modules_blueprint_v2.md**
