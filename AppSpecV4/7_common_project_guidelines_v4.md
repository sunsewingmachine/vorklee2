---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# ⚙️ 07_Common_Project_Guidelines.md  
## Vorklee2 Engineering Standards & Best Practices (v4.0)

---

## 🧭 Purpose

This document defines the **universal development standards** for all Core and App Modules built within the **Vorklee2 Hybrid Multi-App SaaS Platform**, powered by **Next.js 14+, Turborepo, and NeonDB**.

It ensures uniform engineering, quality, and security across the entire system — Core, Notes, Attendance, HR, and future apps.

---

## 🚀 1. Core Objectives

| Objective | Description |
|------------|--------------|
| ⚡ **Performance** | Maintain fast builds, minimal API latency, and optimized queries. |
| 🧩 **Modularity** | Each app is independent but integrates through shared Core packages. |
| 🧱 **Stability** | Type-safe, predictable CI/CD with environment isolation. |
| 🔒 **Security** | Row-level access and JWT authentication via `@core-auth`. |
| 📱 **Cross-Platform** | Full PWA and mobile responsiveness. |
| 🤖 **AI-Readiness** | Consistent structure for AI-assisted development. |

---

## 🧠 2. Architecture Summary

The official structure follows **Turborepo layout**:

```
vorklee2/
├── apps/
│   ├── core/
│   ├── notes/
│   ├── attendance/
│   └── hr/
├── packages/core-*
└── infra/
```

Guidelines:
- Use **Next.js App Router** for all apps.  
- Each app connects to its **own Neon branch** (e.g., `notes-db`).  
- Cross-app integration happens **only through Core APIs** or `@core-*` packages.  
- Shared logic such as Auth, Billing, and Analytics is never duplicated.

---

## 🎨 3. UI/UX Standards

- Use **Material UI v7** (shared theme) for all apps.  
- Follow **WCAG 2.1** accessibility standards.  
- Use **TanStack Query** for async state and caching.  
- Provide proper **loading, error, and empty** states.  
- Maintain Lighthouse score ≥ 90 (performance + accessibility).  
- Responsive, mobile-first design only.

---

## ⚙️ 4. Code Quality Rules

| Rule | Description |
|------|--------------|
| Language | Use **TypeScript** exclusively. |
| Formatting | Apply **ESLint + Prettier** (shared config). |
| Principles | Follow **DRY**, **KISS**, **SOLID**. |
| Logging | No `console.log` in production; use `@core-utils/logger`. |
| Exports | Use named exports for all modules except pages. |
| Comments | Include `// AI:` markers when AI-generated. |

Example comment:
```ts
// AI: Service generated for Notes App | Version 4.0
```

---

## 🧪 5. Testing & QA Standards

| Category | Framework | Target Coverage |
|-----------|------------|----------------|
| Unit Tests | Jest + React Testing Library | ≥ 80% |
| E2E Tests | Playwright | All major flows |
| Integration | Drizzle + Neon | Verify data consistency |
| Accessibility | axe-core | WCAG 2.1 compliance |

Test areas:
- Authentication & JWT validation  
- CRUD API flows  
- Rate limiting and caching  
- Subscription gating  
- UI responsiveness

---

## 🔐 6. Security & Compliance

### Authentication & Authorization
- Always use `@core-auth` for login/session validation.  
- Enforce **row-level isolation** (`organizationId`) in every table.  
- Never trust client-provided `userId` or `organizationId` - derive from session.
- Use **HTTPS**, **secure cookies**, **JWT HMAC SHA256** signatures.  

### Input Validation & Sanitization
- **All user inputs must be validated** using Zod schemas before processing.
- Sanitize all outputs to prevent XSS attacks.
- Use **parameterized queries** (Drizzle ORM handles this automatically).
- Never concatenate user input into SQL queries.
- Validate file uploads: MIME type, file size, file extension.

### CORS Configuration

All API routes must configure CORS appropriately:

```ts
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Request-ID' },
        ],
      },
    ];
  },
};
```

**CORS Policy:**
- Development: Allow all origins (`*`)
- Production: Restrict to specific allowed origins
- Always include credentials when using cookies

### Content Security Policy (CSP)

All apps must implement CSP headers:

```ts
// middleware.ts or next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.vorklee2.com",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];
```

### SQL Injection Prevention

- **Drizzle ORM automatically uses parameterized queries** - never bypass this.
- Never use raw SQL with string interpolation.
- Always validate and sanitize inputs before database operations.

### Secrets Management

- Store env vars only in `.env.local` or CI/CD secrets.  
- **Never commit secrets** to version control.
- Use secrets management tools in production:
  - **Vercel**: Built-in environment variables
  - **AWS**: AWS Secrets Manager
  - **Azure**: Azure Key Vault
- Rotate secrets regularly (JWT_SECRET, database passwords, API keys).

### Compliance & Auditing

- Log all write operations via `@core-audit`.  
- Run **dependency vulnerability scans** monthly.
- Maintain audit trails for compliance (GDPR, SOC 2, etc.).
- Implement data retention policies per compliance requirements.

---

## 🌐 7. Performance Optimization

| Layer | Optimization |
|--------|---------------|
| Frontend | Code splitting, lazy loading, and ISR |
| Backend | Redis caching for frequent reads |
| Assets | Use `next/image` and CDN caching |
| DB | Query optimization + Neon pooling |
| Monitoring | Sentry + Neon metrics |
| API | Rate limiting + parallel batching |

---

## 📱 8. PWA & Mobile Readiness

- Enable PWA via `next-pwa` plugin.  
- Offline caching and A2HS supported.  
- Test on iOS Safari & Android Chrome.  
- Touch gestures optimized for all major pages.

---

## 🧰 9. DevOps & CI/CD

| Stage | Description |
|--------|--------------|
| **Repo Management** | Managed under Turborepo; shared pipelines. |
| **CI/CD** | GitHub Actions with Core-first deploy order. |
| **Environments** | `development`, `staging`, `production`. |
| **Monitoring** | Sentry (errors), PostHog (usage). |
| **Approval Flow** | All merges → review → auto deploy after tests pass. |
| **Deployment Order** | Core → Apps. |

---

## 🗄️ 10. Database Integration

| Component | Standard |
|------------|-----------|
| Database | NeonDB (PostgreSQL) |
| ORM | Drizzle ORM |
| Branching | One Neon branch per app |
| Backup | PITR enabled for all branches |
| Caching | Redis + daily snapshots |
| Schema | Must include `organizationId` for isolation |

Example connection pattern:
```ts
import { drizzle } from "drizzle-orm/neon-http";
export const db = drizzle(process.env.DATABASE_URL_NOTES!);
```

---

## 📄 11. Documentation & Metadata

Each app must include:
- `README.md` → Setup and scripts.  
- `API_DOCS.md` → API references and examples.  
- `CHANGELOG.md` → Semantic versioning.  
- Inline **JSDoc comments** for core logic.  
- AI metadata header (YAML) for all v4.0 docs.  

---

## 👥 12. Collaboration & Version Control

| Policy | Description |
|---------|--------------|
| Branching | `main` → production, `develop` → staging, `feature/*` for work |
| Reviews | Every PR requires 1+ approval |
| Commits | Follow Conventional Commits (`feat:`, `fix:`, `docs:`) |
| Versioning | Semantic (MAJOR.MINOR.PATCH) |
| Documentation | Always updated before merge |

---

## 🧩 13. Modular Dashboard Architecture

The Vorklee2 Dashboard dynamically renders apps and settings based on client entitlements.

### Principles
1. **Global Menus:** Users, Settings, Logout, Help.  
2. **Dynamic Module Menus:** Visible only for purchased apps.  
3. **Shared Settings Tabs:** Language, Currency, Theme, + module-specific tabs.  
4. **Backend Authorization:** Entitlements verified server-side.  
5. **Dashboard Shell:** Handles sidebar, header, state, and module loading.  
6. **Performance:** Lazy-load module code for scalability.

### Example Module Config (`/core/config/modules.ts`)
```ts
export const modules = {
  notes: {
    enabled: true,
    menus: ["All Notes", "Notebooks", "Tags"],
    settingsTabs: ["Notes Preferences"]
  },
  attendance: {
    enabled: false,
    menus: ["Attendance Log", "Reports"],
    settingsTabs: ["Attendance Rules"]
  }
};
```

---

## ✅ 14. Pre-Release Checklist

- [ ] Lint & type checks pass  
- [ ] Unit and E2E tests pass  
- [ ] DB migrations complete  
- [ ] Mobile & desktop UX verified  
- [ ] Env vars configured per app  
- [ ] Docs updated & version bumped  

---

## 📊 15. Success Metrics

| Metric | Target |
|--------|--------|
| Load Time | < 2s |
| Lighthouse | ≥ 90 |
| Accessibility | ≥ 90 |
| Code Coverage | ≥ 80% |
| Uptime | 99.9% |
| Error Rate | < 0.1% |
| CI/CD Success | 100% |

---

## ✅ Summary

The **Vorklee2 Project Guidelines (v4.0)** unify all engineering, security, and performance standards into one enforceable policy.  
These rules ensure **consistency, scalability, and reliability** across every app and module in the ecosystem.

---

**End of File — Vorklee2 Project Guidelines (v4.0)**
