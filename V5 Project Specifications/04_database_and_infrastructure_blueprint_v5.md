---
version: "5.2"
maintainer: "Vorklee2 Infrastructure & DevOps Team"
last_updated: "2025-11-03 03:36:40 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 🗄️ 04_Database_and_Infrastructure_Blueprint_v5.md  
## Multi-Project Neon Database Architecture and Infrastructure Standards for Vorklee2

---

## 🧭 Purpose
This document provides a complete reference for the **Vorklee2 Neon database architecture**, including schema design, infrastructure configuration, scaling strategies, and data compliance requirements.

It ensures that all app modules (Core, Notes, Attendance, HR) operate in isolation yet integrate securely through APIs and shared identity.

---

## 🏗️ 1. Architecture Overview

| Layer | Description |
|--------|--------------|
| **Core DB** | Central identity & permissions |
| **Notes DB** | Notes, tags, attachments |
| **Attendance DB** | Records, check-ins, schedules |
| **HR DB** | Employees, payroll, leaves |
| **Analytics DB** | Read replicas for cross-app metrics |

Each of these is hosted in a separate **Neon Project**, providing compute and storage isolation.

---

## ⚙️ 2. Database Structure

### Example Neon Projects

| Project | Description | Example Database | Schema |
|----------|--------------|------------------|---------|
| `vorklee-core-prod` | Identity & authentication | `core` | `core` |
| `vorklee-notes-prod` | Notes & tags | `notes` | `public` |
| `vorklee-attendance-prod` | Attendance records | `attendance` | `public` |
| `vorklee-hr-prod` | HR & payroll | `hr` | `public` |
| `vorklee-analytics-prod` | Cross-app analytics | `analytics` | `reporting` |

---

## 🧩 3. Schema Design Conventions

| Convention | Description |
|-------------|--------------|
| **UUIDs** | All primary keys use UUID v4. |
| **Timestamps** | Use `created_at`, `updated_at`, `deleted_at` for lifecycle tracking. |
| **Foreign Keys** | Only within same DB (no cross-project FKs). |
| **Naming** | `snake_case` for tables/columns, `PascalCase` for views/functions. |
| **Schema Ownership** | Each service owns its schema. |
| **Audit Fields** | Every table includes `created_by` and `updated_by` referencing `core.users.id`. |

---

## 🧱 4. Infrastructure Components

| Component | Service | Purpose |
|------------|----------|----------|
| **Compute** | Neon Serverless Postgres | On-demand scaling for queries |
| **Storage** | Neon Shared Storage Layer | Durable, encrypted block storage |
| **Networking** | TLS 1.3 with private endpoints | Secure service-to-service connections |
| **Cache** | Redis Cloud | Query and session caching |
| **Backups** | Neon PITR + S3 Snapshots | Recovery and retention |
| **Monitoring** | Neon Insights + Grafana | Query latency and CPU monitoring |

---

## 🔒 5. Security Configuration

- All Neon projects use **TLS 1.3** for in-transit encryption.  
- **AES-256 encryption at rest** (default Neon configuration).  
- **Row-Level Security (RLS)** enforced per tenant via `org_id`.  
- Access controlled via **Neon API keys** restricted by IP range.  
- **Separate DB users** per app service:
  - `service_rw`: full access for app runtime.
  - `migration_user`: limited to migrations.
  - `readonly_user`: analytics reads only.

Example RLS Policy:

```sql
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON public.notes
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

---

## ⚡ 6. Scaling & Performance

| Layer | Scaling Method | Notes |
|--------|----------------|--------|
| **Compute** | Auto-scale Neon compute (1–8 vCPUs) | Based on load |
| **Read Traffic** | Use read replicas (analytics project) | Real-time sync |
| **Writes** | Primary write node only | Transactionally consistent |
| **Indexes** | B-tree + GIN for JSONB/text columns | Optimized queries |
| **Vacuuming** | Automated via Neon | No manual intervention |

---

## 🧮 7. Backups & Recovery

| Type | Frequency | Retention | Tool |
|------|------------|------------|------|
| **PITR** | Continuous | 7 days | Neon built-in |
| **Snapshot** | Daily | 30 days | S3 archive |
| **Manual Export** | On-demand | Until deleted | `pg_dump` |
| **Disaster Recovery** | Cross-region | Standby replica | Automated |

Example manual export:

```bash
pg_dump --schema=notes --file=notes_backup.sql $NOTES_DB_URL
```

---

## 🧠 8. Analytics & Reporting DB

- Project: `vorklee-analytics-prod`
- Schema: `reporting`
- Receives **streamed read replicas** from all app DBs.  
- Used for dashboards, BI, and compliance reporting.  
- Data is anonymized before sync (no raw PII).

**ETL Pipeline Example:**
```bash
pglogical create_subscription sub_notes   connection 'host=vorklee-notes-prod user=readonly password=***'   publication notes_pub;
```

---

## 🧰 9. DevOps and CI/CD

All DB migrations managed via **Drizzle ORM + GitHub Actions**.

### Example Workflow
```yaml
name: DB Migration
on:
  push:
    branches: [main]
jobs:
  migrate:
    steps:
      - run: npm ci
      - run: npx drizzle-kit migrate
      - run: npx drizzle-kit verify
```

- Each PR creates an ephemeral Neon branch for testing.  
- After merge, the branch is deleted automatically.  

---

## 🧾 10. Compliance & Data Governance

| Requirement | Implementation |
|--------------|----------------|
| **GDPR Right to Erasure** | Logical delete via `deleted_at`. |
| **SOC2 Audit Trail** | Writes logged in `core.audit_logs`. |
| **HIPAA PHI Protection** | Encryption in transit and at rest. |
| **Data Residency** | Projects deployed per-region (US, EU, APAC). |
| **PII Anonymization** | ETL to analytics strips identifiers. |

---

## ✅ Summary

This blueprint defines the Neon multi-project database setup and infrastructure policy for the **Vorklee2 Enterprise Platform**.  
It enforces isolation, compliance, and scalability — ensuring long-term stability and security.

---

**End of File — 04_Database_and_Infrastructure_Blueprint_v5.md**
