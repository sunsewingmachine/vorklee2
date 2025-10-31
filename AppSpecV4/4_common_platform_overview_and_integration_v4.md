---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🌐 04_Common_Platform_Overview_and_Integration.md  
## Vorklee2 Multi-App SaaS Platform Overview & Integration Guide (v4.0)

---

## 🧭 Purpose

This document provides a **complete overview of the Vorklee2 platform**, describing how the Core Platform and modular Apps (Notes, Attendance, HR, etc.) interact through shared APIs, databases, and CI/CD pipelines.

It serves as the central integration reference for all developers, AI systems, and DevOps agents.

---

## 🧩 1. Platform Concept

The Vorklee2 ecosystem operates as a **hybrid multi-app SaaS system**, composed of:

- A **shared Core Platform** (`core/`) handling:
  - Authentication (`@core-auth`)
  - Organizations (`@core-orgs`)
  - Billing (`@core-billing`)
  - Analytics (`@core-analytics`)
  - Audit (`@core-audit`)
- Multiple **App Modules**, each in its own folder under `/apps/`, such as:
  - `notes/`
  - `attendance/`
  - `hr/`

Each app runs on its own Neon DB branch but integrates tightly through Core APIs and shared packages.

---

## 🧱 2. High-Level Architecture

```
+-----------------------------------------------------------+
|                    🌐 CORE PLATFORM                        |
|-----------------------------------------------------------|
| Auth | Orgs | Billing | Analytics | Audit | Settings       |
+-----------------------------------------------------------+
              | JWT / Org / Subscription Data |
              v
+-----------------------------------------------------------+
|                APP MODULE (Example: Notes App)            |
|-----------------------------------------------------------|
| API Routes | App Users | Notes | Tags | Attachments        |
+-----------------------------------------------------------+
             | REST Calls | Webhooks | Events |
             v
        NeonDB Branch + Redis Cache
```

---

## ⚙️ 3. Environment Setup

Each app and the Core have separate `.env.local` files.

### Environment Variable Naming Standards

All environment variables follow these conventions:
- **Database URLs**: `DATABASE_URL_[APP_NAME]` (e.g., `DATABASE_URL_CORE`, `DATABASE_URL_NOTES`)
- **API URLs**: `CORE_API_URL` for Core Platform endpoints
- **Public URLs**: `NEXT_PUBLIC_[NAME]` for client-accessible variables
- **Secrets**: No `NEXT_PUBLIC_` prefix for server-only secrets
- **Service URLs**: `[SERVICE]_URL` pattern (e.g., `REDIS_URL`, `FILE_STORAGE_URL`)

### Core Platform `.env.local`
```bash
# Database
DATABASE_URL_CORE=postgresql://user:pass@host/core

# Authentication
JWT_SECRET=supersecret

# Billing
STRIPE_SECRET=sk_live_...

# Infrastructure
REDIS_URL=redis://user:pass@host:port

# Public URLs (client-accessible)
NEXT_PUBLIC_PLATFORM_URL=https://vorklee2.com
```

### App Module `.env.local` (Example: Notes App)
```bash
# Database
DATABASE_URL_NOTES=postgresql://user:pass@host/notes

# Core Integration
CORE_API_URL=https://vorklee2.com/api/core

# Infrastructure
REDIS_URL=redis://user:pass@host:port

# Public URLs (client-accessible)
NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com

# Storage (if app uses file uploads)
FILE_STORAGE_URL=https://cdn.vorklee2.com
```

### Complete Environment Variable Reference

| Variable | Scope | Required | Description | Example |
|----------|-------|----------|-------------|---------|
| `DATABASE_URL_CORE` | Core | ✅ | Core Platform database connection | `postgresql://user:pass@host/core` |
| `DATABASE_URL_[APP]` | App | ✅ | App-specific database connection | `DATABASE_URL_NOTES`, `DATABASE_URL_ATTENDANCE` |
| `JWT_SECRET` | Core | ✅ | Secret for signing JWT tokens | `supersecret` |
| `STRIPE_SECRET` | Core | ✅ | Stripe API secret key | `sk_live_...` |
| `REDIS_URL` | Both | ✅ | Redis connection string | `redis://user:pass@host:port` |
| `CORE_API_URL` | App | ✅ | Base URL for Core Platform APIs | `https://vorklee2.com/api/core` |
| `NEXT_PUBLIC_PLATFORM_URL` | Core | ✅ | Public platform URL | `https://vorklee2.com` |
| `NEXT_PUBLIC_APP_URL` | App | ✅ | Public app URL | `https://notes.vorklee2.com` |
| `FILE_STORAGE_URL` | App | ⚠️ | CDN/S3 URL for file uploads | `https://cdn.vorklee2.com` |
| `VALIDATE_ENV` | Both | ❌ | Enable strict environment validation on startup | `true` (default: `false`) |

**Note**: Replace `[APP]` with the app name in uppercase (e.g., `NOTES`, `ATTENDANCE`, `HR`).

### Environment Variable Validation

All apps must validate required environment variables on startup to fail fast with clear error messages.

**Validation Pattern:**

```ts
// lib/env-validation.ts (shared utility)
import { logger } from "@core-utils";

interface EnvConfig {
  required: string[];
  optional?: Record<string, string>; // key -> default value
}

export function validateEnvironment(config: EnvConfig): void {
  const missing: string[] = [];
  
  for (const key of config.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(", ")}`;
    logger.error(error);
    throw new Error(error);
  }
  
  // Set optional defaults
  if (config.optional) {
    for (const [key, defaultValue] of Object.entries(config.optional)) {
      if (!process.env[key]) {
        process.env[key] = defaultValue;
      }
    }
  }
  
  logger.info("Environment validation passed");
}
```

**Usage Example:**

```ts
// apps/notes/lib/env-validation.ts
import { validateEnvironment } from "@core-utils";

validateEnvironment({
  required: [
    "DATABASE_URL_NOTES",
    "CORE_API_URL",
    "REDIS_URL",
    "NEXT_PUBLIC_APP_URL"
  ],
  optional: {
    "FILE_STORAGE_URL": "https://cdn.vorklee2.com",
    "VALIDATE_ENV": "false"
  }
});
```

### Secrets Management

**Development:**
- Store secrets in `.env.local` files (gitignored)
- Never commit `.env.local` or `.env` files

**Production:**
- Use platform-native secrets management:
  - **Vercel**: Environment variables in dashboard or CLI
  - **AWS**: AWS Secrets Manager with IAM roles
  - **Azure**: Azure Key Vault
  - **GCP**: Secret Manager
- Rotate secrets regularly (90 days for JWT_SECRET, 180 days for API keys)
- Use different secrets per environment (dev, staging, prod)
- Audit secret access logs monthly

**Secrets Rotation Checklist:**
- [ ] JWT_SECRET rotated
- [ ] Database passwords rotated
- [ ] API keys (Stripe, etc.) rotated
- [ ] Redis credentials rotated
- [ ] CDN/storage credentials rotated
- [ ] All apps redeployed with new secrets

---

## 🧭 4. Organization Onboarding Flow

```
1️⃣ User registers via Core Auth → Org created
2️⃣ Admin selects plan → Billing handled by @core-billing
3️⃣ Subscriptions stored in Core DB → linked to app
4️⃣ Users invited → JWT access issued
5️⃣ App validates token via @core-auth
6️⃣ Access granted based on subscription plan
```

Each app enforces entitlement checks through Core APIs.

---

## 🔗 5. Integration Sequence

1. Core issues JWT `{ userId, orgId, appCode }`.  
2. App verifies session via `@core-auth`.  
3. App checks plan validity via `@core-billing`.  
4. App executes internal business logic.  
5. Events logged to `@core-analytics` and `@core-audit`.  

**Data never crosses between app databases.**

---

## 🧪 6. CI/CD Workflow

```
┌─────────────────────────────────────────────┐
│          Vorklee2 CI/CD Pipeline            │
├─────────────────────────────────────────────┤
│ 1️⃣ Install dependencies                    │
│ 2️⃣ Lint and test all core + app packages   │
│ 3️⃣ Apply DB migrations (core + apps)       │
│ 4️⃣ Build @core-* shared packages           │
│ 5️⃣ Build and test each app independently   │
│ 6️⃣ Deploy Core first, then apps            │
│ 7️⃣ Run smoke tests and webhook alerts      │
└─────────────────────────────────────────────┘
```

Use **Turborepo + GitHub Actions** for orchestration.  
Each deployment references environment-specific Neon DB URLs.

---

## 🔐 7. Security and Compliance

| Policy | Enforcement |
|--------|--------------|
| Row-level isolation | Enforced via `organizationId` in all tables |
| JWT validation | Signed HMAC-SHA256 using `JWT_SECRET` |
| Rate limiting | Via `@core-utils/rateLimiter` |
| Auditing | All writes logged via `@core-audit` |
| Secrets | Stored in CI/CD or `.env.local`, never committed |

---

## 📈 8. Monitoring and Observability

| Layer | Tool | Description |
|-------|------|-------------|
| Core | **Sentry** | Error tracking and performance |
| Apps | **PostHog** | Usage analytics |
| Infra | **Grafana / Neon Metrics** | Database latency and load |
| Health | **UptimeRobot** | External uptime checks |

Each event (e.g., note creation) is propagated to Core Analytics for unified reporting.

---

## ⚡ 9. Scaling Strategy

| Layer | Strategy |
|--------|----------|
| **Core DB** | Single Neon instance (schema-based isolation) |
| **App DBs** | Independent Neon branches |
| **API Layer** | Horizontal scaling (Vercel / container clusters) |
| **Cache** | Redis cluster per region |
| **Queue** | BullMQ for background jobs |
| **CDN** | Cloudflare Edge |

Apps can be deployed regionally for latency optimization.

---

## 💾 10. Backup & Recovery

- Daily Neon DB snapshots for all branches  
- PITR (Point-in-Time Recovery) enabled  
- S3 backups via CI/CD automation  
- Periodic restoration testing in staging environments  

---

## 🧠 11. Integration Testing Checklist

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Core Auth login | JWT token issued |
| 2 | App session validation | 200 OK |
| 3 | CRUD operation in app | Data persisted |
| 4 | Subscription check | Verified via Core |
| 5 | Analytics event | Recorded successfully |

---

## 🧰 12. DevOps Commands Reference

```bash
# Start core platform
npm run dev --filter=core

# Start Notes App
npm run dev --filter=notes

# Push DB migrations
npm run db:push --filter=core-db
npm run db:push --filter=notes

# Deploy
npm run deploy --workspace=core
npm run deploy --workspace=notes
```

---

## 🌍 13. Multi-Region Deployment Example

```
🇺🇸 US Region (vorklee2-us)
 ├── core-db
 ├── notes-db
 └── attendance-db

🇪🇺 EU Region (vorklee2-eu)
 ├── core-db
 ├── notes-db
 └── attendance-db

All analytics sync → Global BI layer (Grafana / Metabase)
```

---

## 🚀 14. Future Enhancements

| Feature | Description |
|----------|--------------|
| `@core-gateway` | Unified API routing and request proxy |
| `@core-features` | Dynamic feature flag management |
| `@core-ai` | Shared AI summarization and NLP processing |
| Real-time layer | WebSocket / WebRTC synchronization |

---

## ✅ Summary

The **Platform Overview & Integration Guide (v4.0)** defines how every Vorklee2 component — Core, Apps, and CI/CD — interconnects within a secure, modular, and globally scalable SaaS framework.

It is the **single source of truth** for all integration logic and should be referenced before building or deploying any new app.

---

**End of File — Vorklee2 Platform Overview & Integration (v4.0)**
