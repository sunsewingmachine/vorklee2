---
version: "5.2"
maintainer: "Vorklee2 DevOps / Platform Engineering Team"
last_updated: "2025-11-03 03:35:10 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 🌐 02_Platform_Overview_and_Core_Principles_v5.md  
## Vorklee2 Multi-App SaaS Platform — Core Principles & Environment Overview

---

## 🧭 Purpose
This file defines the **core platform principles**, environment setup, and deployment architecture for the **Vorklee2 Enterprise SaaS ecosystem**.  
It standardizes environment naming, CI/CD behavior, and application integration across the Core Identity service and all app modules.

---

## 🏗 1. Platform Philosophy

> “Single identity, multiple independent applications — securely connected by APIs and events.”

### Core Tenets
- **Isolation:** Each app runs on its own Neon project and deployment pipeline.  
- **Integration:** Auth, billing, and analytics unified under Core APIs.  
- **Scalability:** Horizontal compute scaling per app.  
- **Observability:** Shared metrics and logs across environments.  
- **Automation:** Full CI/CD and AI-driven documentation upkeep.

---

## ⚙️ 2. Environment Structure

| Environment | Purpose | Example Neon Branch |
|--------------|----------|----------------------|
| **Production** | Live customer data | `main` |
| **Staging** | Pre-deployment testing | `staging` |
| **Development** | Feature builds and QA | `dev` |
| **Preview** | PR-based ephemeral branches | auto-created |

Each environment mirrors the same DB schema and configuration via Drizzle migrations.

---

## 🌍 3. Core Platform Composition

| Component | Technology | Responsibility |
|------------|-------------|----------------|
| **Frontend** | Next.js 14 (App Router) | UI rendering and client routing |
| **Backend** | Edge Functions / Node APIs | Business logic and integrations |
| **Database** | Neon Postgres (serverless) | Persistent storage |
| **Cache** | Redis Cloud (TLS + ACL) | Session, list, and hot-data caching |
| **Queue** | BullMQ (Redis-based) | Background and async tasks |
| **Storage** | S3 + Cloudflare R2 (encrypted) | File and attachment storage |
| **API Gateway** | Cloudflare Workers + WAF | Request routing and security filtering |
| **Service Mesh** | Future: Istio/Linkerd | Service-to-service mTLS and observability |
| **Monitoring** | Sentry, Grafana, PostHog | Logs, metrics, analytics |
| **AI Layer** | @core-ai (LangChain + GPT-5) | Summarization and automation |

---

## 🧩 4. Deployment & Infrastructure

### CI/CD Flow (GitHub Actions)

```
1️⃣ Commit to main
2️⃣ Run tests & lint
3️⃣ Deploy Core (Vercel / Cloud Run)
4️⃣ Deploy app modules (parallel)
5️⃣ Run migrations (Neon)
6️⃣ Trigger health checks
```

Each deployment triggers `@core-audit` for compliance logging.

### Infrastructure as Code
Managed via **Terraform** and **NeonCTL**:
```bash
terraform apply -auto-approve
neonctl branches create --project vorklee-notes-prod staging
```

---

## 🔒 5. Security Model

### Zero Trust Architecture
The platform implements **zero trust security** principles:
- **Never Trust, Always Verify**: Every request authenticated and authorized regardless of origin.
- **Least Privilege Access**: Services granted minimum required permissions only.
- **Assume Breach**: Network segmentation limits blast radius of potential compromises.
- **Continuous Verification**: Tokens validated on every request with short TTLs.

### Security Layers

| Area | Mechanism | Details |
|-------|-----------|---------|
| **Authentication** | Centralized JWT (Core Identity) | RS256 signed, 24h expiry, key rotation every 90 days |
| **Authorization** | Role & app-based access tokens | RBAC + ABAC with policy enforcement |
| **Data Isolation** | org_id scoping + RLS | Postgres Row-Level Security enforced |
| **Network Security** | TLS 1.3 everywhere + mTLS for inter-service | Certificate pinning, HSTS enabled |
| **Secrets Management** | HashiCorp Vault + Vercel Secrets | Encrypted at rest, 90-day rotation |
| **Backups** | PITR + automated S3 snapshots | Encrypted with customer-managed keys |
| **API Gateway** | WAF with DDoS protection | Rate limiting, IP filtering, geo-blocking |
| **Service-to-Service** | HMAC request signing + mTLS | SHA-256 signatures with timestamp validation |

### Network Security

```
Internet → Cloudflare WAF → API Gateway → Service Mesh → Application Pods
   ↓           ↓                 ↓              ↓               ↓
  TLS 1.3   DDoS Protection   Rate Limit    mTLS         Pod Network Policy
```

**Network Policies:**
- **Ingress**: Only from API Gateway (IP whitelisting)
- **Egress**: Whitelist destinations only (DB, Redis, external APIs)
- **Service-to-Service**: mTLS required, no plaintext communication
- **Database**: Private endpoints only, no public internet access

### Redis Security Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **TLS** | Required (TLS 1.3) | Encrypt data in transit |
| **Authentication** | ACL with per-service users | Least privilege access |
| **Password** | 32-char random + 90-day rotation | Strong authentication |
| **Commands** | Restricted (no FLUSHDB, FLUSHALL, KEYS) | Prevent accidental data loss |
| **Encryption at Rest** | AES-256 | Protect persisted data |
| **Network** | Private VPC only | No public internet access |
| **Maxmemory Policy** | allkeys-lru | Prevent memory exhaustion |

**Redis Instance Separation:**
- `redis-session`: User sessions and JWT refresh tokens
- `redis-cache`: Application data caching
- `redis-queue`: BullMQ job queues

All environments maintain identical security posture with environment-specific secrets.

---

## 🧠 6. Scaling & Performance

| Layer | Method |
|--------|--------|
| **App Compute** | Auto-scale via Vercel or Kubernetes |
| **DB Reads** | Read replicas (Neon Analytics Project) |
| **Cache** | Redis global replication |
| **Assets** | CDN edge caching |
| **Monitoring** | Query latency < 100 ms, p95 response < 250 ms |

---

## 🧰 7. Observability Stack

| Tool | Purpose |
|------|----------|
| **Sentry** | Error & performance tracing |
| **Grafana + Neon Insights** | DB metrics |
| **PostHog** | Feature usage analytics |
| **OpenTelemetry** | Distributed tracing |
| **Slack Webhooks** | Deployment alerts |

---

## 🧩 8. Regional Deployment Strategy

Multi-region architecture supports compliance and latency goals.

| Region | Example Project | Data Residency |
|--------|------------------|----------------|
| 🇺🇸 US | `vorklee-us-*` | Default |
| 🇪🇺 EU | `vorklee-eu-*` | GDPR |
| 🇸🇬 APAC | `vorklee-apac-*` | APAC customers |

Analytics aggregated via `vorklee-analytics-prod`.

---

## 🔐 9. Data Classification System

All data in the platform is classified to determine appropriate security controls:

| Level | Description | Examples | Access Control |
|-------|-------------|----------|----------------|
| **Public** | Safe for public disclosure | Marketing content, public docs | No restrictions |
| **Internal** | Business operations data | Internal docs, metrics | Authenticated users only |
| **Confidential** | Sensitive business data | User data, business plans | Need-to-know basis + encryption |
| **PHI/PII** | Regulated personal data | Healthcare records, SSN | Strict access logs + encryption + compliance |

**Handling Requirements by Classification:**
- **Public**: Standard TLS encryption
- **Internal**: TLS + authentication + audit logging
- **Confidential**: TLS + encryption at rest + RLS + audit logging + MFA
- **PHI/PII**: All of above + data masking + anonymization for analytics + HIPAA BAA

---

## ✅ 10. Summary

The **Platform Overview** defines how all components — Core, Apps, and CI/CD — interoperate under a unified, secure, and observable architecture.
- **Zero trust security** with continuous verification and least privilege access
- **Multi-layered defense** from API gateway to service mesh to database RLS
- **Comprehensive data classification** system guiding security controls
- **Redis security** with TLS, ACL, and instance separation
- **Network segmentation** limiting blast radius of potential breaches
This serves as the foundation for all other documents within `/docs/specs_v5/`.

---

**End of File — 02_Platform_Overview_and_Core_Principles_v5.md**
