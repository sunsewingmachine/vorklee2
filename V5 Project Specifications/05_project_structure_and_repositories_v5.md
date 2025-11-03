---
version: "5.2"
maintainer: "Vorklee2 Engineering & Platform Team"
last_updated: "2025-11-03 03:37:40 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 🗂️ 05_Project_Structure_and_Repositories_v5.md  
## Turborepo Architecture, Naming Conventions, and Repository Standards for Vorklee2

---

## 🧭 Purpose
This document defines the **project and repository organization** for the Vorklee2 platform under version **v5.2**.  
It ensures a consistent and scalable monorepo architecture, enabling AI automation, modular builds, and clear ownership across all app and core services.

---

## 🧱 1. Monorepo Structure (Turborepo)

The **Turborepo** acts as the main workspace for all modules, apps, and libraries.  
Root directory layout:

```
/vorklee2/
 ├── apps/
 │    ├── core/
 │    ├── notes/
 │    ├── attendance/
 │    ├── hr/
 │    └── analytics/
 ├── packages/
 │    ├── ui/
 │    ├── utils/
 │    ├── auth-client/
 │    ├── config/
 │    └── db/
 ├── docs/
 │    └── specs_v5/
 ├── scripts/
 ├── .github/
 ├── turbo.json
 └── package.json
```

---

## 🧩 2. Folder Descriptions

| Folder | Description |
|---------|--------------|
| `apps/` | Individual service modules, each deployed independently |
| `packages/` | Shared libraries (UI, utils, API SDKs) |
| `docs/` | Architecture documentation and AI specifications |
| `scripts/` | Automation and build scripts |
| `.github/` | CI/CD workflows and templates |

---

## ⚙️ 3. Repository Naming Standards

| Type | Format | Example |
|------|----------|----------|
| **Main Monorepo** | `vorklee2` | `github.com/vorklee/vorklee2` |
| **App Repo (optional split)** | `vorklee2-{app}` | `vorklee2-notes` |
| **Infra Repo** | `vorklee2-infra` | Terraform and NeonCTL setup |
| **Docs Repo** | `vorklee2-docs` | Public documentation mirror |

---

## 🧠 4. Workspace Configuration (Turborepo)

Example `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

Each app defines its own build target and depends on shared libraries in `packages/`.

---

## 🧰 5. Shared Packages

| Package | Purpose | Example |
|----------|----------|----------|
| `@vorklee/ui` | Shared UI components (Tailwind + Radix) | Buttons, forms |
| `@vorklee/utils` | Shared TypeScript utilities | Date/time helpers |
| `@vorklee/auth-client` | Core identity client SDK | Token verification |
| `@vorklee/config` | Shared environment configuration | Load env vars securely |
| `@vorklee/db` | Shared Drizzle ORM setup | DB connections |

Each package includes its own `README.md`, `tsconfig.json`, and versioned changelog.

---

## 🔐 6. Environment Configuration

| Layer | File | Example |
|--------|-------|----------|
| **Global** | `.env` | `CORE_API_URL`, `JWT_PUBLIC_KEY` |
| **App Specific** | `.env.local` | `NOTES_DB_URL`, `REDIS_URL` |
| **CI/CD Secrets** | GitHub Actions / Vault | Managed per environment |

All secrets are encrypted using **GitHub Encrypted Secrets** and **HashiCorp Vault**.

---

## 🧩 7. Development Standards

| Standard | Tool | Rule |
|-----------|------|------|
| **Language** | TypeScript (strict) | Enforced via ESLint |
| **Style** | Prettier | Common formatting rules |
| **Testing** | Jest / Vitest | ≥ 80% coverage |
| **Commits** | Conventional Commits | `feat:`, `fix:`, `chore:` |
| **Branching** | GitFlow | `feature/*`, `release/*`, `hotfix/*` |

---

## 🧠 8. Build and Deployment Process

| Stage | Description |
|--------|--------------|
| **Build** | Each app independently compiled via Turborepo |
| **Test** | Unit + integration tests run via GitHub Actions |
| **Deploy** | Vercel / Cloud Run deploys apps using per-app config |
| **Migrate** | Drizzle ORM migrations to Neon via CI/CD |
| **Docs** | Auto-sync architecture specs to `/docs/specs_v5/` |

Example CI snippet:

```yaml
jobs:
  build-deploy:
    steps:
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npx drizzle-kit push
```

---

## 🧾 9. Code Ownership and Review Policy

- Each app folder (`apps/*`) owned by a dedicated team.  
- Shared packages reviewed by **Platform Engineering**.  
- At least **two approvals required** for merge into `main`.  
- AI-generated code must include `AI-METADATA` comment header.  

Example:
```ts
// AI-METADATA: { "generator": "GPT-5", "context": "API route generation" }
```

---

## ✅ Summary

The Turborepo and repository structure provide a scalable, modular foundation for the entire Vorklee2 ecosystem.  
By standardizing naming, CI/CD, and coding practices, it enables consistent developer experience and safe automation across all services.

---

**End of File — 05_Project_Structure_and_Repositories_v5.md**
