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

### Ownership Model
- Each app folder (`apps/*`) owned by a dedicated team per CODEOWNERS file
- Shared packages (`packages/*`) reviewed by **Platform Engineering**
- Infrastructure code (`scripts/`, `.github/`) owned by **DevOps team**
- Documentation (`docs/`) reviewed by **Technical Writing + Engineering**

### Code Review Requirements
- **Minimum Approvals**: 2 reviewers (1 code owner + 1 peer)
- **Security Changes**: Additional review by Security team
- **Database Migrations**: Review by DBA + automated schema validation
- **AI-Generated Code**: Must include `AI-METADATA` header + human review

**CODEOWNERS File Example:**
```
# Apps
/apps/core/*        @vorklee/core-team
/apps/notes/*       @vorklee/notes-team
/apps/attendance/*  @vorklee/attendance-team

# Packages
/packages/ui/*          @vorklee/platform-engineering
/packages/auth-client/* @vorklee/security-team
/packages/db/*          @vorklee/platform-engineering

# Infrastructure
/.github/*       @vorklee/devops
/scripts/*       @vorklee/devops
/terraform/*     @vorklee/devops

# Documentation
/docs/*          @vorklee/tech-writers @vorklee/engineering
```

### AI-Generated Code Standards
```ts
// AI-METADATA: {
//   "generator": "GPT-5",
//   "version": "2025-01",
//   "context": "API route generation",
//   "reviewed_by": "john@vorklee.com",
//   "review_date": "2025-01-15"
// }
```

### Commit Signing Policy
- **Required**: GPG-signed commits for all production branches
- **Key Management**: Store public keys in GitHub
- **Verification**: CI/CD rejects unsigned commits
- **Key Size**: Minimum 4096-bit RSA or Ed25519

**Setup GPG Signing:**
```bash
# Generate key
gpg --full-generate-key
# Configure Git
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true
# Verify
git log --show-signature
```

---

## 🔒 10. Supply Chain Security

### Dependency Management

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **npm audit** | Vulnerability scanning | Run on every PR, fail on moderate+ |
| **Snyk** | Continuous monitoring | Daily scans, auto-PR for fixes |
| **Dependabot** | Automated updates | Weekly security patches |
| **npm-check-updates** | Version management | Monthly major version reviews |

### Security Scanning Pipeline

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      # 1. Dependency vulnerabilities
      - name: npm audit
        run: npm audit --audit-level=moderate

      # 2. Snyk vulnerability scan
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      # 3. Container image scanning
      - name: Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'

      # 4. Secret scanning
      - name: TruffleHog secret scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

      # 5. License compliance
      - name: License checker
        run: npx license-checker --production --failOn "GPL;AGPL"
```

### SBOM (Software Bill of Materials)

**Generation:**
```bash
# Generate SBOM for each app
npm run sbom:generate
# Output: sbom-{app}-{version}.json

# SBOM format: SPDX 2.3 or CycloneDX 1.4
```

**SBOM Contents:**
- All direct and transitive dependencies
- License information
- Known vulnerabilities (CVE references)
- Package hashes for verification
- Build-time metadata

**Storage & Distribution:**
- Stored in artifact registry with release
- Signed with GPG for authenticity
- Published to transparency log

### Provenance Attestation

Using **SLSA (Supply-chain Levels for Software Artifacts)** framework:

```yaml
# Generate provenance
- name: Generate provenance
  uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v1.4.0
  with:
    base64-subjects: ${{ needs.build.outputs.hashes }}
```

**Provenance includes:**
- Source repository and commit SHA
- Build platform and environment
- Builder identity and timestamp
- Materials (dependencies) used
- Build parameters and commands

### Dependency Pinning Strategy

```json
// package.json
{
  "dependencies": {
    "next": "14.0.4",              // Exact version (not ^14.0.4)
    "@radix-ui/react-dialog": "1.0.5"
  },
  "devDependencies": {
    "typescript": "5.3.3",         // Pinned versions
    "eslint": "8.56.0"
  }
}
```

**Update Policy:**
- **Security patches**: Within 48 hours of disclosure
- **Minor updates**: Monthly review and testing
- **Major updates**: Quarterly evaluation with migration plan

### Private Package Registry

- **NPM Enterprise**: Private packages at `@vorklee/*`
- **Access Control**: Token-based with 90-day rotation
- **Malware Scanning**: All packages scanned before publish
- **Provenance**: Required for all internal packages

### Vulnerability Response

| Severity | Response Time | Action |
|----------|---------------|--------|
| **Critical** | < 4 hours | Immediate hotfix + emergency deploy |
| **High** | < 24 hours | Prioritized patch + deploy next day |
| **Moderate** | < 7 days | Include in next sprint |
| **Low** | < 30 days | Address in maintenance window |

---

## ✅ 11. Summary

The Turborepo and repository structure provide a scalable, modular foundation for the entire Vorklee2 ecosystem.

**Supply Chain Security Highlights:**
- **Signed Commits**: GPG-required for all production code
- **Automated Scanning**: Snyk + Trivy + TruffleHog on every commit
- **SBOM Generation**: Full dependency transparency per release
- **Provenance Attestation**: SLSA Level 3 build verification
- **Dependency Pinning**: Exact versions with controlled update process
- **Vulnerability Response**: 4-hour SLA for critical issues

By standardizing naming, CI/CD, supply chain security, and coding practices, it enables consistent developer experience and safe automation across all services.

---

**End of File — 05_Project_Structure_and_Repositories_v5.md**
