---
version: "5.2"
maintainer: "Vorklee2 Enterprise Architecture Team"
last_updated: "2025-11-03 03:40:22 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 🏗️ 08_Enterprise_Architecture_Master_Blueprint_v5.md  
## Unified Architecture Specification for the Vorklee2 SaaS Platform

---

## 🧭 Purpose
This master blueprint consolidates all **V5.2 architectural, security, database, and engineering standards** for the **Vorklee2 Enterprise Platform**.  
It serves as the authoritative document linking together the Core, App Modules, Infrastructure, and Compliance systems.

---

## 🧱 1. Core Architectural Model

```
          ┌───────────────────────────────┐
          │        Core Identity          │
          │ (Auth, Orgs, Roles, Licenses) │
          └──────────────┬────────────────┘
                         │
 ┌───────────────────────┼────────────────────────┐
 │                       │                        │
 ▼                       ▼                        ▼
Notes App          Attendance App              HR App
(Notes, Tags)      (Check-ins, Shifts)         (Employees, Payroll)
 │                       │                        │
 └──────────────┬────────┴────────────┬───────────┘
                ▼                     ▼
          Analytics DB         External APIs (Webhook/Event Bus)
```

Each module runs in a **dedicated Neon project**, sharing identity and access control via Core APIs.

---

## ⚙️ 2. Technology Stack Overview

| Layer | Tool / Platform | Purpose |
|--------|-----------------|----------|
| **Frontend** | Next.js 14 (React) | Application UI |
| **Backend** | Node.js 20 / Edge Functions | API endpoints |
| **Database** | Neon Serverless Postgres | Storage layer |
| **Cache** | Redis Cloud | Session and data cache |
| **Message Bus** | Kafka / RabbitMQ | Event-driven communication |
| **Auth** | JWT (Core Identity) | Centralized authentication |
| **Infra as Code** | Terraform + NeonCTL | Infrastructure automation |
| **Monitoring** | Sentry / Grafana / PostHog | Observability & analytics |

---

## 🧩 3. Multi-Project Neon Architecture

| Project | Role | Schema | Description |
|----------|------|---------|-------------|
| `vorklee-core-prod` | Identity service | `core` | Auth, orgs, permissions |
| `vorklee-notes-prod` | Notes app | `public` | Notes, tags, attachments |
| `vorklee-attendance-prod` | Attendance app | `public` | Records, shifts |
| `vorklee-hr-prod` | HR system | `public` | Employees, leaves, payroll |
| `vorklee-analytics-prod` | BI & analytics | `reporting` | Aggregated data |

**Isolation Model:** Each project runs on independent compute/storage, minimizing cross-impact and improving scalability.

---

## 🔑 4. Authentication & Authorization Model

- Centralized identity in `vorklee-core-prod`.  
- JWT issued upon login and verified by all app modules.  
- Role-based permissions managed in `core.app_permissions`.  
- All app APIs consume and verify Core’s public key.  
- Internal communication signed with HMAC headers.

Example JWT payload:
```json
{
  "user_id": "uuid",
  "org_id": "uuid",
  "apps": ["notes", "attendance"],
  "roles": {"notes": "admin", "attendance": "viewer"},
  "exp": 1728000000
}
```

---

## 🧰 5. Infrastructure & Deployment Strategy

| Layer | Platform | Method |
|--------|-----------|--------|
| **Hosting** | Vercel / Cloud Run | App deploys |
| **Database** | Neon Projects | Multi-region setup |
| **Cache** | Redis | Session storage |
| **Storage** | S3 / R2 | File uploads |
| **CI/CD** | GitHub Actions | Build + deploy automation |
| **IaC** | Terraform + NeonCTL | Environment provisioning |

Example deployment flow:
```
Commit → CI Tests → Migrate DB → Deploy App → Notify Core Audit
```

---

## 🔒 6. Security & Compliance Overview

| Area | Control |
|-------|----------|
| **Encryption** | TLS 1.3 (in-transit), AES-256 (at rest) |
| **RLS** | Per-org enforcement in each schema |
| **Secrets** | Vault + GitHub Encrypted Secrets |
| **Auditing** | Centralized in Core DB (`audit_logs`) |
| **Key Rotation** | Every 90 days |
| **User Data Removal** | GDPR-compliant deletion & anonymization |

All services maintain **zero-trust isolation** and adhere to SOC2 controls.

---

## 🧩 7. Observability & Monitoring

- **Sentry** — error logging and tracing  
- **Grafana** — metrics visualization via Neon Insights  
- **PostHog** — product analytics  
- **OpenTelemetry** — distributed tracing across services  
- **Slack Webhooks** — deployment and alert notifications  

**Metrics Collected:**
- Response time (p95, p99)
- DB query latency
- API error rate
- Auth success/failure ratio
- Resource utilization per app

---

## 🧮 8. Data Lifecycle & Retention Policy

| Data Type | Retention | Method |
|------------|------------|---------|
| **User Data** | 7 years | Encrypted + soft delete |
| **Audit Logs** | 1 year | Exported to analytics DB |
| **Backups** | 30 days | S3 + PITR |
| **Event Streams** | 7 days | Kafka topic retention |

**Right to Erasure:** Handled asynchronously via Core events → app-level cleanup.

---

## 🧾 9. Governance & Review Cycle

- Architecture reviewed **quarterly** by Platform and Security teams.  
- Changes tracked in `/docs/specs_v5/changelog.md`.  
- All new apps must register in Core before deployment.  
- Schema updates validated via CI (`drizzle-kit verify`).  
- Internal audit performed bi-annually for SOC2 readiness.

---

## ✅ 10. Summary

This **Enterprise Architecture Master Blueprint** unifies all Vorklee2 components — from identity and apps to infrastructure and compliance — under a single, auditable, and scalable system.  
It ensures long-term maintainability, data protection, and cross-service consistency.

---

**End of File — 08_Enterprise_Architecture_Master_Blueprint_v5.md**
