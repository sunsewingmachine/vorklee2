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

### Enhanced RLS Policies

**Basic Organization Isolation:**
```sql
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Read policy with role-based access
CREATE POLICY org_isolation_select ON public.notes
  FOR SELECT
  USING (
    org_id = current_setting('app.current_org_id')::uuid
    AND (
      -- User owns the note
      user_id = current_setting('app.current_user_id')::uuid
      -- OR user has appropriate role
      OR EXISTS (
        SELECT 1 FROM core.app_permissions
        WHERE user_id = current_setting('app.current_user_id')::uuid
          AND org_id = current_setting('app.current_org_id')::uuid
          AND app_id = (SELECT id FROM core.apps WHERE code = 'notes')
          AND role IN ('admin', 'editor', 'viewer')
      )
    )
  );

-- Write policy (stricter than read)
CREATE POLICY org_isolation_write ON public.notes
  FOR INSERT
  WITH CHECK (
    org_id = current_setting('app.current_org_id')::uuid
    AND user_id = current_setting('app.current_user_id')::uuid
  );

-- Update policy with role check
CREATE POLICY org_isolation_update ON public.notes
  FOR UPDATE
  USING (
    org_id = current_setting('app.current_org_id')::uuid
    AND (
      user_id = current_setting('app.current_user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM core.app_permissions
        WHERE user_id = current_setting('app.current_user_id')::uuid
          AND org_id = current_setting('app.current_org_id')::uuid
          AND role IN ('admin', 'editor')
      )
    )
  );

-- Delete policy (admin only)
CREATE POLICY org_isolation_delete ON public.notes
  FOR DELETE
  USING (
    org_id = current_setting('app.current_org_id')::uuid
    AND (
      user_id = current_setting('app.current_user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM core.app_permissions
        WHERE user_id = current_setting('app.current_user_id')::uuid
          AND org_id = current_setting('app.current_org_id')::uuid
          AND role = 'admin'
      )
    )
  );
```

### Connection Pooling Strategy

**PgBouncer Configuration:**
```ini
[databases]
notes = host=vorklee-notes-prod.neon.tech port=5432 dbname=notes

[pgbouncer]
pool_mode = transaction           # Transaction pooling for serverless
max_client_conn = 1000            # Max client connections
default_pool_size = 25            # Connections per database
reserve_pool_size = 5             # Reserve for admin
reserve_pool_timeout = 3          # Seconds
max_db_connections = 100          # Total DB connections
max_user_connections = 100        # Per user limit
server_idle_timeout = 600         # 10 minutes
server_lifetime = 3600            # 1 hour
```

**Per-Service Connection Limits:**
- **Web App**: 25 connections (main API)
- **Background Jobs**: 10 connections (async tasks)
- **Analytics**: 5 connections (read-only queries)
- **Migrations**: 2 connections (schema changes)
- **Admin**: 3 connections (manual operations)

**Connection Storm Prevention:**
- Circuit breaker: Open after 10 failed connections
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
- Queue requests when pool exhausted (max 100 queued)
- Alert when > 80% connections in use

---

## ⚡ 6. Scaling & Performance

| Layer | Scaling Method | Configuration | Thresholds |
|--------|----------------|---------------|------------|
| **Compute** | Auto-scale Neon compute (1–8 vCPUs) | Horizontal scaling | Scale up: CPU > 70% for 3min<br>Scale down: CPU < 30% for 10min |
| **Memory** | Auto-adjust (2–32 GB) | Per compute tier | Alert at > 85% usage |
| **Read Traffic** | Read replicas (analytics project) | Async replication (< 1s lag) | Max 5 read replicas |
| **Writes** | Primary write node only | Single source of truth | Queue writes if > 10k/min |
| **Indexes** | B-tree + GIN for JSONB/text | Partial indexes for large tables | Rebuild weekly |
| **Vacuuming** | Automated via Neon | Auto-vacuum aggressive | Manual vacuum after bulk ops |
| **Connection Pool** | PgBouncer transaction mode | 25 per service | Alert at > 80% utilization |

### Performance Targets (SLIs)

| Metric | Target | Monitoring |
|--------|--------|------------|
| **Query Latency P95** | < 100ms | Neon Insights + Grafana |
| **Query Latency P99** | < 250ms | Alert if exceeded |
| **Write Latency P95** | < 50ms | Critical for user experience |
| **Connection Time** | < 10ms | Via PgBouncer |
| **Replication Lag** | < 1 second | Read replica monitoring |
| **Index Hit Ratio** | > 99% | Cache efficiency |
| **Active Connections** | < 80 (of 100) | Connection pool health |

### Query Optimization
- Slow query log: Queries > 100ms
- Auto-explain for queries > 500ms
- Query plan analysis via `pg_stat_statements`
- Index recommendations via Neon advisor
- Materialized views for complex aggregations (refreshed hourly)

---

## 🧮 7. Backups & Recovery

### Backup Strategy

| Type | Frequency | Retention | Encryption | Location | RTO | RPO |
|------|-----------|-----------|------------|----------|-----|-----|
| **PITR** | Continuous | 7 days | AES-256 | Neon internal | < 5 min | < 5 min |
| **Snapshot** | Every 6 hours | 30 days | AES-256 + CMK | S3 (us-east-1) | < 1 hour | < 6 hours |
| **Daily Archive** | Daily at 02:00 UTC | 90 days | AES-256 + CMK | S3 Glacier | < 4 hours | < 24 hours |
| **Weekly Full** | Sunday 00:00 UTC | 1 year | AES-256 + CMK | S3 Glacier Deep | < 12 hours | < 7 days |
| **Manual Export** | On-demand | Until deleted | Unencrypted (user responsible) | User-defined | N/A | N/A |
| **Cross-Region DR** | Continuous replication | Real-time | AES-256 | S3 (eu-west-1) | < 1 hour | < 5 min |

### Disaster Recovery Specifications

**Recovery Time Objective (RTO):** < 1 hour
- Time to restore service after catastrophic failure

**Recovery Point Objective (RPO):** < 5 minutes
- Maximum acceptable data loss in time

**DR Procedures:**
1. **Detection**: Automated health checks every 30 seconds
2. **Alerting**: PagerDuty escalation within 1 minute
3. **Failover**: Automatic to cross-region replica (< 5 minutes)
4. **Verification**: Automated smoke tests post-failover
5. **Communication**: Status page updated within 2 minutes

### Backup Encryption

**At-Rest Encryption:**
```
Data → AES-256-GCM → Customer-Managed Key (CMK) → S3 Bucket
         ↓
    Server-side encryption (SSE-KMS)
    Key rotation: Every 90 days
    Key access: Logged to CloudTrail
```

**Encryption Keys:**
- **Primary Key**: AWS KMS Customer Managed Key (CMK)
- **Key Policy**: Restricted to backup service role only
- **Key Rotation**: Automatic every 90 days
- **Key Backup**: Exported to offline HSM (Hardware Security Module)

### Backup Verification

| Test Type | Frequency | Success Criteria |
|-----------|-----------|------------------|
| **Restore Test** | Weekly | Full database restore < 1 hour |
| **Data Integrity** | Daily | Checksum validation 100% match |
| **Cross-Region Sync** | Hourly | Replication lag < 1 second |
| **DR Drill** | Quarterly | Full failover + restore < RTO |

### Backup Monitoring

**Metrics Tracked:**
- Backup completion time (alert if > 30 minutes)
- Backup size growth (alert if > 20% increase)
- Failed backups (alert immediately)
- Restore test success rate (target: 100%)
- Replication lag (alert if > 10 seconds)

**Alerting:**
- Failed backup → PagerDuty critical alert
- Backup time exceeds SLA → Warning alert
- Encryption key rotation due → 7-day notice

### Manual Backup Commands

**Full database export:**
```bash
# Encrypted export
pg_dump --schema=notes --format=custom $NOTES_DB_URL | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -out notes_backup.dump.enc

# Schema only
pg_dump --schema-only --schema=notes $NOTES_DB_URL > schema.sql

# Data only (with COPY for speed)
pg_dump --data-only --schema=notes --format=custom $NOTES_DB_URL > data.dump
```

**Restore from backup:**
```bash
# Decrypt and restore
openssl enc -aes-256-cbc -d -pbkdf2 -in notes_backup.dump.enc | \
  pg_restore --dbname=$NOTES_DB_URL --clean --if-exists

# Point-in-time recovery via Neon
neonctl branches create --project vorklee-notes-prod \
  --name recovery-$(date +%Y%m%d) \
  --restore-to "2025-01-15T10:30:00Z"
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

| Requirement | Implementation | Verification |
|--------------|----------------|--------------|
| **GDPR Right to Erasure** | Soft delete via `deleted_at` → Hard delete after 90 days + crypto-shredding | Automated compliance report |
| **GDPR Data Portability** | Export API returns all user data in JSON/CSV | User self-service portal |
| **SOC2 Audit Trail** | All DB writes logged in `core.audit_logs` with retention | Quarterly SOC2 audit |
| **HIPAA PHI Protection** | AES-256 encryption + access logging + BAA with Neon | Annual HIPAA assessment |
| **HIPAA Access Controls** | Role-based access + MFA for PHI + 6-year audit logs | Continuous monitoring |
| **Data Residency** | Regional Neon projects (US, EU, APAC) + no cross-border transfer | Geolocation enforcement |
| **PII Anonymization** | K-anonymity (k≥5) + differential privacy for analytics | Data quality checks |
| **Data Classification** | Public, Internal, Confidential, PHI with appropriate controls | Automated tagging |

### Data Retention & Deletion Policies

| Data Type | Retention Period | Deletion Method | Compliance |
|-----------|------------------|-----------------|------------|
| **User Account Data** | Active + 7 years post-deletion request | Soft → Hard delete + crypto-shredding | GDPR, CCPA |
| **Audit Logs** | 1 year (6 years for HIPAA data) | Archive to cold storage → Delete | SOC2, HIPAA |
| **Backup Data** | Per backup policy (7-365 days) | Secure wipe + key destruction | All |
| **Session Data** | 24 hours or logout | Redis TTL expiration | Privacy best practices |
| **Soft-Deleted Records** | 90 days | Crypto-shredding (key destruction) | GDPR |

### Crypto-Shredding Process
When hard-deleting user data:
1. Identify all records with `deleted_at` > 90 days
2. Export record IDs to audit log
3. Destroy per-record encryption keys (rendering data unrecoverable)
4. Mark records as `crypto_shredded = true`
5. Overwrite sensitive fields with null
6. Generate compliance certificate

### Data Anonymization for Analytics

**Techniques Applied:**
- **PII Stripping**: Remove email, phone, IP addresses, names
- **K-Anonymity**: Ensure k≥5 (each record indistinguishable from 4+ others)
- **Generalization**: Replace precise values with ranges (age 32 → 30-35)
- **Perturbation**: Add statistical noise to numeric values (±5%)
- **Differential Privacy**: ε=1.0 privacy budget for aggregate queries

**Example Pipeline:**
```sql
-- Anonymize users for analytics
INSERT INTO analytics.users_anon
SELECT
  -- Preserve analytics value
  user_id,                        -- Keep (UUID is not PII)
  org_id,                         -- Keep
  DATE_TRUNC('month', created_at) AS signup_month,  -- Generalize
  -- Remove PII
  NULL AS email,
  NULL AS name,
  NULL AS phone,
  -- Anonymize location
  SUBSTRING(country, 1, 2) AS country_code,
  NULL AS city,
  -- Preserve behavior
  note_count,
  last_active_at
FROM core.users
WHERE deleted_at IS NULL;
```

---

## ✅ Summary

This blueprint defines the Neon multi-project database setup and infrastructure policy for the **Vorklee2 Enterprise Platform**.

**Key Enhancements:**
- **Enhanced RLS**: Role-based policies with granular CRUD permissions
- **Connection Pooling**: PgBouncer with transaction mode, 25 connections per service
- **Performance SLIs**: P95 latency < 100ms, P99 < 250ms with continuous monitoring
- **Disaster Recovery**: RTO < 1 hour, RPO < 5 minutes with cross-region replication
- **Backup Encryption**: AES-256 + CMK with 90-day key rotation
- **Compliance**: GDPR crypto-shredding, HIPAA 6-year logs, SOC2 audit trails
- **Data Anonymization**: K-anonymity and differential privacy for analytics
- **Auto-Scaling**: Dynamic compute (1-8 vCPUs) based on 70% CPU threshold

It enforces isolation, compliance, and scalability — ensuring long-term stability and security.

---

**End of File — 04_Database_and_Infrastructure_Blueprint_v5.md**
