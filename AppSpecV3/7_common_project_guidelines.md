# ⚙️ Next.js Project Guidelines – Vorklee2 Architecture (v2)

This document defines the **universal development standards** for all apps built within the **Vorklee2 Hybrid Multi-App SaaS Platform**, powered by Next.js 14+, Turborepo, and NeonDB.

It applies to both the **Core Platform** and all **App Modules** (Notes, Attendance, HR, etc.), ensuring a consistent, scalable, and AI-ready development workflow.

---

## 🚀 1. Core Objectives

Every Vorklee2 Next.js project must ensure:

- ⚡ **Performance & Scalability** — Fast builds, optimized queries, and smooth user experience.
- 🧩 **Modularity** — Independent apps powered by shared `@core-*` packages.
- 🧱 **Stability** — Strong typing, isolation between services, predictable CI/CD.
- 🔒 **Security** — Row-level isolation and secure authentication via `@core-auth`.
- 📱 **Cross-platform readiness** — Optimized for PWA and responsive UI.
- 🧑‍💻 **Maintainability** — Turborepo-managed monorepo with shared linting and formatting rules.
- 🤖 **AI-Readiness** — Structure compatible with AI-assisted generation and validation.

---

## 🧠 2. Architecture & Folder Structure

Follow the **official Vorklee2 Turborepo layout**:

```
vorklee2/
├── apps/
│   ├── core/              → Shared platform (auth, orgs, billing)
│   ├── notes/             → Notes App (feature-specific)
│   ├── attendance/        → Attendance App
│   └── hr/                → HR App (future)
│
├── packages/
│   ├── core-auth/
│   ├── core-orgs/
│   ├── core-billing/
│   ├── core-analytics/
│   ├── core-audit/
│   ├── core-utils/
│   └── core-features/
│
├── infra/
│   ├── ci/github-actions/
│   ├── docker/
│   ├── backup/
│   └── neon/
│
├── turbo.json
├── package.json
└── README.md
```

### Guidelines

- Use **App Router** for all apps.
- Each app maintains **its own Neon branch** (e.g. `notes-db`, `attendance-db`).
- Cross-app integration happens only through **Core APIs and packages**, never direct DB access.
- Shared logic (auth, billing, analytics, etc.) must always come from `packages/core-*`.

---

## 🎨 3. UI/UX Standards

- **Material UI v7** (shared theme) for consistent styling across apps.
- **TanStack Query** for async state and caching.
- Responsive, mobile-first design with **WCAG 2.1 accessibility**.
- Provide clear **loading, error, and empty states**.
- Use **shared design tokens** for spacing, typography, and color themes.
- Target **Lighthouse ≥ 90** for performance, accessibility, and SEO.

---

## ⚙️ 4. Code Quality Rules

- **TypeScript-only** for all files.
- Use **ESLint + Prettier** (shared config in root).
- Follow **DRY**, **KISS**, and **SOLID** principles.
- Avoid side effects in pure functions (except React hooks).
- No console logs or commented code in production.
- Use named exports (except page components).
- Follow AI-generated code review policies when applicable.

---

## 🧪 5. Testing & QA

- Unit tests: **Jest + React Testing Library**
- E2E tests: **Playwright**
- Integration tests per app.
- Coverage target: **≥80%**
- Test areas:
  - Core auth & JWT validation
  - CRUD operations via app APIs
  - Rate limiting and caching
  - Plan-based feature gating
  - Responsive UI & accessibility

---

## 🔐 6. Security & Compliance

- Use `@core-auth` for all login/session handling.
- Enforce **organization-level row isolation** via `organizationId`.
- Sanitize all inputs and outputs (both Core and Apps).
- HTTPS, secure cookies, and JWT HMAC SHA256 signatures.
- Environment variables stored only in `.env.local` or CI secrets.
- All write operations logged via `@core-audit`.

---

## 🌐 7. Performance Optimization

- **next/image** for asset optimization.
- **Static Site Generation (SSG)** and **Incremental Static Regeneration (ISR)** where applicable.
- **Server Components** preferred for lightweight bundles.
- **Redis caching** for high-frequency data.
- **Code splitting** and **lazy loading** for heavy routes.
- Use **TanStack Query caching** and invalidation logic per org.
- Monitor via **Sentry + Neon metrics**.

---

## 📱 8. Mobile & PWA Readiness

- PWA setup via `next-pwa` with:
  - Offline caching
  - Add-to-home-screen prompts
- Responsive gestures and touch support.
- Mobile testing required for iOS Safari and Android Chrome.

---

## 🧰 9. DevOps, CI/CD & Deployment

- **Turborepo-based CI/CD** using GitHub Actions.
- Deployment order: Core → Apps.
- Automatic branch creation per app in Neon.
- Environments:
  - `development`, `staging`, `production`
- **Sentry** for error monitoring.
- **PostHog** or **Vercel Analytics** for metrics.
- All builds and tests must pass before merge to `main`.

---

## 🗄️ 10. Database & Neon Setup

- One **Neon project** with multiple branches (`core-db`, `notes-db`, etc.).
- Each app connects to its branch using Drizzle ORM.
- Point-in-Time Recovery (PITR) enabled.
- Redis for caching layer.
- Database URL pattern:

```
DATABASE_URL_CORE=postgresql://.../core
DATABASE_URL_NOTES=postgresql://.../notes
```

---

## 📄 11. Documentation

Each app must include:

- `README.md` — setup, scripts, env list.
- `API_DOCS.md` — endpoints and parameters.
- `CHANGELOG.md` — semantic versioning.
- Inline JSDoc for critical logic.
- AI metadata annotations (for code generation).

---

## 🧑‍🤝‍🧑 12. Collaboration & Version Control

- Branch strategy:
  - `main` → production
  - `develop` → staging
  - `feature/*`, `fix/*` → work branches
- PRs require at least one review.
- Commit conventions:
  - `feat:`, `fix:`, `chore:`, `docs:`
- Follow **semantic versioning**.
- Keep documentation and schema changes in sync with commits.

---

## 🛠️ 13. Error Handling & Logging

- React Error Boundaries at app root.
- Centralized logging via `@core-utils/logger`.
- User-friendly error screens (`/app/error.tsx`).
- No stack traces exposed client-side.
- Server logs stream to Sentry.

---

## ✅ 14. Pre-Release Checklist

- [ ] Lint & Type checks pass
- [ ] Unit and E2E tests pass
- [ ] Core + App DB migrations complete
- [ ] Mobile & Desktop UX verified
- [ ] Env vars configured per app
- [ ] Docs updated
- [ ] Version bumped

---

## 📊 15. Success Metrics

| Metric | Target |
|--------|--------|
| Load Time | < 2s |
| Lighthouse Score | ≥ 90 |
| Accessibility | ≥ 90 |
| Code Coverage | ≥ 80% |
| Uptime | 99.9% |
| Error Rate | < 0.1% |
| CI/CD Success | 100% before merge |

---

🧩 16. Modular Dashboard Architecture

The Vorklee2 platform implements a Modular Dashboard Architecture, allowing dynamic rendering of apps, menus, and settings based on each client’s purchased modules.

Overview

Each client account has access to a different set of purchased modules (apps), such as Notes, Attendance, Catalog, HR, etc.
The system automatically builds the main dashboard and settings page according to the modules the client owns.

Core Principles

Global Menus (Always Visible)

Users

Settings

Logout

Help (optional)

Dynamic Module Menus

Each purchased module contributes its own sidebar menus and submenus.
Example:

If a client has Notes and Attendance, only those menus appear in the sidebar.

If another client owns Catalog and HR, their sidebar reflects that combination.

Shared Settings Page

The Settings page includes default tabs:

Language

Currency

Time Zone

Theme

Each module may register additional tabs (e.g., “Notes Preferences”, “Attendance Rules”).

Backend Enforcement

The backend determines module entitlements and permissions.

The frontend must only display what the backend confirms to prevent unauthorized access.

Pluggable Module Design

Each module must self-register its:

Menu items

Routes/pages

Settings tabs

API endpoints

Dashboard Shell Responsibilities

Render the main layout (sidebar, header, content).

Load and unload modules dynamically.

Maintain global state (user, permissions, theme, settings).

Provide communication hooks for modules (events, APIs, context).

Performance Optimization

Use lazy loading or micro-frontend principles to load each module only when needed.

This ensures scalability across multiple apps and minimal initial bundle size.

Implementation Notes

Define module metadata in a config file, such as:

/core/config/modules.ts


The dashboard reads this config and dynamically builds UI components.

Example structure:

export const modules = {
  notes: {
    enabled: true,
    menus: ["All Notes", "Notebooks", "Tags"],
    settingsTabs: ["Notes Preferences"],
  },
  attendance: {
    enabled: false,
    menus: ["Attendance Log", "Reports"],
    settingsTabs: ["Attendance Rules"],
  },
  catalog: {
    enabled: true,
    menus: ["Items", "Categories", "Suppliers"],
    settingsTabs: ["Catalog Settings"],
  },
};

📄 Version

Template Version: 2.1
Framework: Next.js 14+ (Turborepo)
Platform: Vorklee2 Multi-App SaaS
Maintainer: Vorklee2 DevOps Team
Last Updated: (auto-sync per project)