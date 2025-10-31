---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🧩 03_Common_Modules_Blueprint.md  
## Shared Platform Core for the Vorklee2 Multi-App SaaS Ecosystem (v4.0)

---

## 🧭 Purpose

This file defines the **Core Modules Blueprint** — the shared foundation powering every application in the **Vorklee2 Hybrid Multi-App SaaS Platform**.  
It establishes how all modules (e.g., Auth, Billing, Orgs, Analytics, Audit) work together to enable modular, secure, and scalable app development.

---

## 🧠 1. Core Design Philosophy

### Core Principle
> “One identity and billing system, many independent app databases.”

This ensures:
- A **single source of truth** for authentication, organizations, and subscriptions.  
- Each app (Notes, Attendance, HR, etc.) runs its **own isolated database branch** for scalability.  
- Cross-app communication occurs exclusively through **Core APIs** or **shared packages** (`@core-*`).

---

## 🧱 2. Core Database Overview

The Core Database stores **organization-wide metadata**, user identities, app registry info, and subscription states.

### Schema Example

#### `organizations`
```ts
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  ownerEmail: text("owner_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### `apps`
```ts
export const apps = pgTable("apps", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(), // e.g. 'notes', 'attendance'
  name: text("name").notNull(),
  description: text("description"),
});
```

#### `subscriptions`
```ts
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  appId: uuid("app_id")
    .references(() => apps.id)
    .notNull(),
  planCode: text("plan_code").notNull(),
  status: text("status").default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});
```

#### `plan_features`
```ts
export const planFeatures = pgTable("plan_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  planCode: text("plan_code").notNull(),
  feature: text("feature").notNull(),
  limitValue: integer("limit_value"),
});
```

#### `global_users`
```ts
export const globalUsers = pgTable("global_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  role: text("role").default("org_admin").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## ⚙️ 3. Core Package Responsibilities

| Package | Description | Example Import |
|----------|--------------|----------------|
| `@core-auth` | Authentication, JWT, and session middleware | `import { verifySession } from "@core-auth"` |
| `@core-users` | Global user CRUD and identity linkage | `import { getUserByEmail } from "@core-users"` |
| `@core-orgs` | Organization management, invites, and roles | `import { listOrgs } from "@core-orgs"` |
| `@core-billing` | Subscriptions and plan verification via Stripe | `import { getSubscriptionStatus } from "@core-billing"` |
| `@core-settings` | Org-wide and app-level configuration storage | `import { getSetting } from "@core-settings"` |
| `@core-notifications` | Email, push, and in-app notification delivery | `import { sendEmail } from "@core-notifications"` |
| `@core-analytics` | Tracks user engagement and system usage | `import { logEvent } from "@core-analytics"` |
| `@core-audit` | Monitors all write operations for compliance | `import { recordAudit } from "@core-audit"` |
| `@core-utils` | Shared utilities, logger, environment helpers | `import { logger } from "@core-utils"` |

---

## 🔐 4. Authentication and Session Lifecycle

### Standard Flow
1. User logs in through **Core Auth API** (`/api/core/auth/login`).  
2. Core validates credentials via `global_users`.  
3. Core issues a JWT with `{ userId, orgId, appCode, exp }`.  
4. Apps verify tokens using `@core-auth.verifySession()`.  
5. Apps use local `app_users` to map Core identity → App permissions.

This pattern ensures secure, tenant-aware isolation across modules.

---

## 🧩 5. Rate Limiting & Security Controls

- Use **Redis-based rate limiting** (`@core-utils/rateLimiter.ts`).  
- JWTs must include `orgId`, `appCode`, and TTL.  
- All cookies: `httpOnly`, `secure`, and `sameSite=lax`.  
- Every API mutation logs to `@core-audit`.  
- Secrets stored in `.env.local` or CI secrets only.  

Example configuration:
```ts
export const limiter = rateLimiter({ points: 100, duration: 60 });
```

---

## 🌐 6. Monitoring and Observability

| Tool | Purpose |
|------|----------|
| **Sentry** | Error logging and performance tracing |
| **PostHog** | Analytics and usage tracking |
| **Grafana / Neon Metrics** | Database performance |
| **UptimeRobot** | External uptime monitoring |

Every app emits usage and audit events to **Core Analytics**.

---

## ⚡ 7. Scaling & Infrastructure Strategy

| Layer | Technology | Notes |
|--------|-------------|-------|
| **DB** | Neon (with multiple branches) | One branch per app |
| **Cache** | Redis | Shared pool per org cluster |
| **Queue** | BullMQ | For async event processing |
| **Backup** | PITR + S3 Snapshots | Managed by CI/CD |
| **Deployment** | Vercel / Container clusters | Core first, then apps |

---

## 🧩 8. Future Extensions (Planned)

| Module | Purpose |
|---------|----------|
| `@core-gateway` | Unified request router and service discovery |
| `@core-features` | Plan-based feature gating and flags |
| `@core-ai` | Shared AI summarization, NLP, and insights layer |
| `@core-webhooks` | Outbound integrations and event hooks |

---

## ✅ Summary

The **Common Modules Blueprint (v4.0)** defines the foundation that enables modular growth across all apps within Vorklee2.

It guarantees:
- Unified identity and billing  
- Isolation per app database  
- Shared auditing, analytics, and observability  
- Seamless AI and DevOps compatibility

---

**End of File — Common Modules Blueprint (v4.0)**
