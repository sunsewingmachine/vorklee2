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

### Zero Trust Security Model

The platform implements comprehensive zero trust architecture:
- **Identity Verification**: JWT with RS256 4096-bit keys, 90-day rotation, jti-based replay prevention
- **Least Privilege**: Role-based access with granular RLS policies at database level
- **Network Segmentation**: API Gateway → Service Mesh → mTLS → Application → Private DB
- **Continuous Monitoring**: All requests logged with trace_id for end-to-end visibility

### Security Controls by Layer

| Layer | Control | Implementation |
|-------|---------|----------------|
| **Application** | Authentication | JWT (24h expiry) + MFA (TOTP/SMS/Email) + Device fingerprinting |
| **Application** | Authorization | RBAC + ABAC with policy enforcement per endpoint |
| **Network** | Encryption in Transit | TLS 1.3 + mTLS for inter-service + Perfect Forward Secrecy |
| **Database** | Encryption at Rest | AES-256-GCM + Customer-Managed Keys (CMK) |
| **Database** | RLS | Enhanced role-based policies with CRUD-level permissions |
| **Database** | Connection Security | PgBouncer with transaction pooling, 25 connections per service |
| **Secrets** | Key Management | HashiCorp Vault + AWS KMS with 90-day rotation |
| **Auditing** | Comprehensive Logging | Centralized `core.audit_logs` with 1-year retention (6 years for PHI) |
| **Backup** | Data Protection | AES-256 encrypted backups with CMK, RTO < 1hr, RPO < 5min |
| **Identity** | Password Security | Argon2id (64MB, 3 iterations) + per-user salt + server pepper |
| **API** | Rate Limiting | Tiered: 10/100/1000 req/min with DDoS protection via WAF |
| **Supply Chain** | Code Integrity | GPG-signed commits + SBOM + SLSA Level 3 provenance |

### Compliance Framework

| Standard | Requirement | Implementation | Verification |
|----------|-------------|----------------|--------------|
| **GDPR** | Right to Erasure | Soft delete → Hard delete (90d) + crypto-shredding | Automated reports |
| **GDPR** | Data Portability | Export API (JSON/CSV) | User self-service |
| **GDPR** | Consent Management | Granular consent tracking | Audit logs |
| **SOC2** | Access Controls | MFA + RBAC + RLS | Quarterly audit |
| **SOC2** | Audit Logs | All changes logged with retention | Continuous monitoring |
| **SOC2** | Backup & Recovery | Encrypted backups + DR testing | Weekly restore tests |
| **HIPAA** | PHI Protection | AES-256 + access logging + BAA | Annual assessment |
| **HIPAA** | Access Logs | 6-year retention + tamper-proof | Compliance automation |
| **HIPAA** | Minimum Necessary** | Role-based data masking | Policy enforcement |
| **PCI DSS** | No Card Storage | Stripe/payment processor only | N/A - not storing cards |

### Data Classification & Handling

| Classification | Encryption | Access Control | Audit | Anonymization |
|----------------|------------|----------------|-------|---------------|
| **Public** | TLS 1.3 | None required | Optional | N/A |
| **Internal** | TLS 1.3 + at rest | Authentication required | Standard | N/A |
| **Confidential** | TLS 1.3 + AES-256 + CMK | MFA + RBAC + RLS | Enhanced | For analytics |
| **PHI/PII** | TLS 1.3 + AES-256 + CMK + Field-level | MFA + RBAC + RLS + Minimum necessary | Full (6yr) | K-anonymity (k≥5) |

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

## 📊 10. Performance & Reliability Targets

### Service Level Objectives (SLOs)

| Service | Metric | Target | Error Budget |
|---------|--------|--------|--------------|
| **API Availability** | Uptime | 99.9% (43.2min/month) | 0.1% |
| **API Latency P95** | Response time | < 250ms | 5% can exceed |
| **API Latency P99** | Response time | < 500ms | 1% can exceed |
| **Database P95** | Query latency | < 100ms | 5% can exceed |
| **Auth Success Rate** | Login success | > 99.5% | 0.5% failures |
| **Deployment Frequency** | Production deploys | Daily | N/A |
| **MTTR** | Mean time to recovery | < 1 hour | N/A |
| **Change Failure Rate** | Failed deployments | < 5% | N/A |

### Disaster Recovery

- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 5 minutes
- **Cross-Region Failover**: Automatic within 5 minutes
- **Backup Verification**: Weekly restore tests
- **DR Drills**: Quarterly full failover exercises

### Scalability Targets

- **Concurrent Users**: 100,000+
- **API Requests**: 10,000 req/sec
- **Database Connections**: 100 per project via PgBouncer
- **Storage**: Unlimited (Neon serverless)
- **Horizontal Scaling**: Auto-scale 1-8 vCPUs per workload

---

## ✅ 11. Summary

This **Enterprise Architecture Master Blueprint** unifies all Vorklee2 components — from identity and apps to infrastructure and compliance — under a single, auditable, and scalable system.

**Architecture Highlights:**
- **Zero Trust Security**: Multi-layered defense with continuous verification
- **Enterprise Authentication**: Argon2id + JWT + MFA + Device fingerprinting
- **Database Excellence**: Enhanced RLS, PgBouncer pooling, < 100ms P95 latency
- **Disaster Recovery**: RTO < 1hr, RPO < 5min, automated cross-region failover
- **Compliance Ready**: GDPR, SOC2, HIPAA with automated controls
- **High Availability**: 99.9% SLO with comprehensive monitoring
- **Supply Chain Security**: GPG commits + SBOM + SLSA Level 3
- **Observability**: Structured logging, OpenTelemetry tracing, comprehensive dashboards

It ensures long-term maintainability, data protection, and cross-service consistency at enterprise scale.

---

**End of File — 08_Enterprise_Architecture_Master_Blueprint_v5.md**
