### Index: 2 of 4 — Platform Overview and Integration (Hybrid SaaS System)
# 🌐 Platform Overview and Integration v2 – End-to-End Multi-App SaaS Platform

This document describes how to set up, operate, and integrate all parts of the system — the **Core Platform** (see `1_common_modules_blueprint_v2.md`) and **individual Apps** such as Notes, Attendance, and others.

It includes environment setup, onboarding, CI/CD, and scaling strategies, with visual ASCII diagrams to help both developers and AI agents understand the architecture.

---

## 1️⃣ Platform Purpose

To provide a **unified SaaS environment** where multiple independent applications share:
- Authentication (`@core-auth`)
- Organizations (`@core-orgs`)
- Billing (`@core-billing`)
- Shared analytics and audit (`@core-analytics`, `@core-audit`)

Each app has its own database but integrates with the shared core.

---

## 2️⃣ High-Level Architecture Diagram

```
+----------------------------------------------------------+
|                   🌐 CORE PLATFORM                        |
|----------------------------------------------------------|
| Auth  | Orgs | Billing | Analytics | Audit | Settings    |
+---+----+------+----------+-----------+---------+----------+
    |            |              |                 |
    | JWT Token  | Org ID       | Subscription    |
    |            |              |                 |
+---v------------v--------------v-----------------v---------+
|                  APP LAYER (e.g., Notes App)              |
|-----------------------------------------------------------|
| Notes API | App Users | Tags | Attachments | Notebooks    |
+-----------------------------------------------------------+
           |                   |
           | REST API Calls     |
           v                   v
      PostgreSQL DB        Redis Cache
```

---

## 3️⃣ Environment Setup

Each layer (Core and App) has its own environment variables.  
Define them separately in `.env` files.

### Core `.env`
```
DATABASE_URL_CORE=postgresql://user:pass@host:port/core
STRIPE_SECRET=sk_live_...
REDIS_URL=redis://user:pass@host:port
NEXT_PUBLIC_PLATFORM_URL=https://your-platform.com
JWT_SECRET=supersecret
```

### Notes App `.env`
```
DATABASE_URL_NOTES=postgresql://user:pass@host:port/notes
CORE_API_URL=https://your-platform.com/api/core
NEXT_PUBLIC_APP_URL=https://notes.your-platform.com
```

---

## 4️⃣ Organization Onboarding Flow

```
+--------------------+
| 1️⃣  User visits Core  |
+--------------------+
          |
          v
+--------------------+
| 2️⃣  Create Org & Admin |
+--------------------+
          |
          v
+--------------------+
| 3️⃣  Choose App Plan  |
| (e.g., Notes Pro)    |
+--------------------+
          |
          v
+--------------------+
| 4️⃣  Subscription Created |
+--------------------+
          |
          v
+--------------------+
| 5️⃣  Invite Users        |
+--------------------+
          |
          v
+--------------------+
| 6️⃣  Access App (JWT)  |
+--------------------+
```

Once step 6 completes, users log into any app directly using `@core-auth` JWT.

---

## 5️⃣ Integration Flow

1. Core issues JWT containing `{ userId, orgId, appCode }`  
2. App validates token using `@core-auth.verifySession()`  
3. App checks active subscription via `@core-billing`  
4. App executes its business logic in its dedicated DB  
5. App emits analytics and audit events to Core APIs  

**Data never crosses app DB boundaries** — isolation is mandatory.

---

## 6️⃣ CI/CD Pipeline Diagram

```
┌──────────────────────────────────────────────────┐
│              CI/CD PIPELINE STAGES               │
├──────────────────────────────────────────────────┤
│ 1️⃣  Install dependencies (core + apps)           │
│ 2️⃣  Run lint & tests for core packages           │
│ 3️⃣  Push DB migrations (core + per app)          │
│ 4️⃣  Build all @core-* packages                   │
│ 5️⃣  Build each app independently                 │
│ 6️⃣  Deploy Core first, then dependent apps       │
│ 7️⃣  Run smoke tests & notify via webhook         │
└──────────────────────────────────────────────────┘
```

Each app deployment references its own `.env`.  
Use **Turborepo** or **GitHub Actions** to orchestrate builds.

---

## 7️⃣ Security and Compliance Controls

- Row-level access enforced by `organizationId`
- JWT signed with HMAC SHA256 (via `JWT_SECRET`)
- Rate limiting via `@core-utils/rateLimiter`
- All write events logged in `core-audit`
- Passwords hashed with bcrypt
- Per-environment secrets isolated in CI/CD

---

## 8️⃣ Monitoring and Observability

| Layer | Tool | Description |
|-------|------|-------------|
| Core | PostHog | Analytics and user behavior |
| Core | Sentry | Error tracking |
| Apps | UptimeRobot | Health checks |
| DB | Neon Metrics | Query latency and CPU load |

Each event from an app (e.g., note creation) is forwarded to `core-analytics`.

---

## 9️⃣ Scaling Plan

| Layer | Strategy |
|--------|----------|
| Core DB | Single Neon instance (schema-based) |
| App DBs | Dedicated Neon branches per app |
| API | Horizontal scaling (Vercel / container) |
| Cache | Redis cluster |
| Queue | BullMQ for async jobs |
| CDN | Cloudflare Edge |

Each app can be deployed to a **different geographic region** for latency optimization.

---

## 🔟 Backup & Recovery

- Daily Neon snapshot for every DB branch  
- PITR (Point-in-Time Recovery) enabled  
- S3 backup for exports (encrypted)  
- Backup pipeline runs nightly in CI

---

## 1️⃣1️⃣ Integration Test Flow

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Core Auth: Login | JWT returned |
| 2 | Notes API: Validate session | 200 OK |
| 3 | Notes CRUD: Create note | Returns noteId |
| 4 | Billing: Check plan | Plan verified |
| 5 | Analytics: Log event | Entry in `core-analytics` |

---

## 1️⃣2️⃣ Developer Commands

```bash
# Run core platform
npm run dev --filter=core-auth

# Run notes app
npm run dev --filter=notes

# Apply DB migrations
npm run db:push --filter=core-db
npm run db:push --filter=notes

# Deploy (CI/CD)
npm run deploy --workspace=core
npm run deploy --workspace=notes
```

---

## 1️⃣3️⃣ Environment Variable Reference

| Variable | Description |
|-----------|-------------|
| DATABASE_URL_CORE | Connection string for Core DB |
| DATABASE_URL_NOTES | Connection for Notes App DB |
| STRIPE_SECRET | Stripe billing key |
| REDIS_URL | Redis cache server |
| JWT_SECRET | Secret for signing tokens |
| NEXT_PUBLIC_PLATFORM_URL | Base platform URL |

---

## 1️⃣4️⃣ Multi-Region Deployment Example

```
+-------------------+       +-------------------+
| 🇺🇸 US Region      | <----> | 🇪🇺 EU Region      |
| Core + Notes US   |       | Core + Notes EU   |
| Neon Branch (US)  |       | Neon Branch (EU)  |
+-------------------+       +-------------------+
         ^                         ^
         |                         |
         +-- Shared Analytics Core +-----> Global BI Dashboard
```

Each region runs independently but syncs analytics to a global reporting layer.

---

## 1️⃣5️⃣ Future Expansion

- Add `@core-gateway` for unified routing  
- Introduce `@core-features` for plan-based toggles  
- Integrate `@core-ai` for note summarization and tagging  
- Add real-time sync (WebSocket or WebRTC layer)

---

**End of File – 2_platform_overview_and_integration_v2.md**
