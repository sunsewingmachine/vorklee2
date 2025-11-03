---
version: "5.3"
maintainer: "Vorklee2 Infrastructure & DevOps Team"
last_updated: "2025-01-15 12:00:00 UTC"
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

**Connection Pool Auto-Scaling Rules:**

| Condition | Action | Threshold | Cooldown |
|-----------|--------|-----------|----------|
| **Utilization > 80% for 2min** | Scale up pool size by 25% | 80% | 5 minutes |
| **Utilization > 90% for 1min** | Scale up pool size by 50% | 90% | 2 minutes |
| **Utilization < 30% for 10min** | Scale down pool size by 25% | 30% | 10 minutes |
| **Failed connections > 10 in 30s** | Open circuit breaker | 10 failures | 1 minute |
| **Queue depth > 50 requests** | Alert + scale up | 50 queued | Immediate |

**Auto-Scaling Implementation:**

```typescript
// Connection pool monitoring service
export class ConnectionPoolMonitor {
  private checkInterval = 30000; // 30 seconds

  async monitorPool() {
    const stats = await this.getPoolStats();
    const utilization = (stats.active / stats.total) * 100;

    if (utilization > 80 && this.shouldScaleUp()) {
      await this.scaleUp(0.25); // Increase by 25%
      logger.info('Scaled up connection pool', { utilization, newSize: stats.total * 1.25 });
    } else if (utilization < 30 && this.shouldScaleDown()) {
      await this.scaleDown(0.25); // Decrease by 25%
      logger.info('Scaled down connection pool', { utilization, newSize: stats.total * 0.75 });
    }

    // Alert if approaching limits
    if (utilization > 90) {
      await sendAlert('Connection pool > 90% utilization', {
        utilization,
        active: stats.active,
        total: stats.total,
      });
    }
  }

  private async getPoolStats() {
    // Query PgBouncer stats endpoint or database
    return {
      active: await this.getActiveConnections(),
      total: await this.getTotalConnections(),
      queued: await this.getQueuedRequests(),
    };
  }
}
```

**Connection Storm Prevention:**
- Circuit breaker: Open after 10 failed connections in 30 seconds
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
- Queue requests when pool exhausted (max 100 queued)
- Alert when > 80% connections in use
- Auto-scale pool when utilization > 80% for 2 minutes

**Connection Pool Health Dashboard:**

```sql
-- Monitor connection pool health
SELECT 
  datname,
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  (count(*) FILTER (WHERE state = 'active')::float / count(*)::float * 100) as utilization_pct
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname;
```

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

### Per-Query-Type Performance SLAs

**Query Performance Targets by Type:**

| Query Type | P95 Target | P99 Target | Monitoring | Alert Threshold |
|------------|-----------|-----------|------------|-----------------|
| **SELECT (Simple)** | < 50ms | < 100ms | Neon Insights | P95 > 75ms |
| **SELECT (Join 2-3 tables)** | < 100ms | < 250ms | Neon Insights | P95 > 150ms |
| **SELECT (Complex aggregation)** | < 200ms | < 500ms | Neon Insights | P95 > 300ms |
| **INSERT (Single row)** | < 50ms | < 100ms | Application logs | P95 > 75ms |
| **INSERT (Bulk 100+ rows)** | < 500ms | < 1000ms | Application logs | P95 > 750ms |
| **UPDATE (Single row)** | < 75ms | < 150ms | Application logs | P95 > 100ms |
| **UPDATE (Bulk)** | < 300ms | < 600ms | Application logs | P95 > 450ms |
| **DELETE (Single row)** | < 50ms | < 100ms | Application logs | P95 > 75ms |
| **DELETE (Bulk)** | < 200ms | < 500ms | Application logs | P95 > 300ms |

**Query Performance Monitoring:**

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  (total_exec_time / 1000 / 60) as total_minutes
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- Slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Performance Regression Detection:**

```typescript
// CI/CD performance test
export async function detectPerformanceRegression() {
  const baseline = {
    select: 50, // ms
    insert: 50,
    update: 75,
    delete: 50,
  };

  const current = await measureQueryPerformance();

  for (const [type, baselineTime] of Object.entries(baseline)) {
    const currentTime = current[type];
    const regression = ((currentTime - baselineTime) / baselineTime) * 100;

    if (regression > 10) {
      throw new Error(
        `${type} query regression: ${regression.toFixed(1)}% slower than baseline`
      );
    }
  }
}
```

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

**Automated Backup Testing (Mandatory):**

| Test Type | Frequency | Success Criteria | Automation |
|-----------|-----------|------------------|------------|
| **Restore Test** | Weekly (Sunday 02:00 UTC) | Full database restore < 1 hour | Automated script |
| **Data Integrity** | Daily (02:00 UTC) | Checksum validation 100% match | Automated validation |
| **Cross-Region Sync** | Hourly | Replication lag < 1 second | Continuous monitoring |
| **DR Drill** | Quarterly (First Sunday of quarter) | Full failover + restore < RTO | Semi-automated |
| **Point-in-Time Recovery** | Monthly | PITR to 1 hour ago < 15 minutes | Automated test |

**Automated Backup Restore Test Script:**

```bash
#!/bin/bash
# scripts/backup-restore-test.sh

set -e

echo "🔄 Starting automated backup restore test..."

# 1. Create test branch
RESTORE_BRANCH="restore-test-$(date +%Y%m%d)"
neonctl branches create \
  --project vorklee-notes-prod \
  --name "$RESTORE_BRANCH" \
  --parent main

# 2. Restore from latest snapshot
echo "📥 Restoring from snapshot..."
neonctl branches restore \
  --project vorklee-notes-prod \
  --branch "$RESTORE_BRANCH" \
  --snapshot-id "$LATEST_SNAPSHOT"

# 3. Verify data integrity
echo "✅ Verifying data integrity..."
psql "$RESTORE_DB_URL" <<EOF
SELECT 
  'notes' as table_name,
  COUNT(*) as row_count,
  MD5(string_agg(id::text, '' ORDER BY id)) as checksum
FROM notes
UNION ALL
SELECT 
  'notebooks' as table_name,
  COUNT(*) as row_count,
  MD5(string_agg(id::text, '' ORDER BY id)) as checksum
FROM notebooks;
EOF

# 4. Verify checksums match production
PRODUCTION_CHECKSUM=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT MD5(string_agg(id::text, '')) FROM notes")
RESTORE_CHECKSUM=$(psql "$RESTORE_DB_URL" -t -c "SELECT MD5(string_agg(id::text, '')) FROM notes")

if [ "$PRODUCTION_CHECKSUM" != "$RESTORE_CHECKSUM" ]; then
  echo "❌ Checksum mismatch! Backup may be corrupted."
  exit 1
fi

# 5. Cleanup
echo "🧹 Cleaning up test branch..."
neonctl branches delete \
  --project vorklee-notes-prod \
  --name "$RESTORE_BRANCH"

echo "✅ Backup restore test passed!"
```

**CI/CD Integration:**

```yaml
# .github/workflows/backup-test.yml
name: Weekly Backup Restore Test

on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 02:00 UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup-restore-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run backup restore test
        run: bash scripts/backup-restore-test.sh
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          PRODUCTION_DB_URL: ${{ secrets.DATABASE_URL_NOTES }}
      
      - name: Alert on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚨 Backup restore test failed!",
              "attachments": [{
                "color": "danger",
                "text": "Weekly backup restore test failed. Manual intervention required."
              }]
            }
```

### Read Replica Consistency SLAs

**Replication Lag Targets:**

| Consistency Level | Max Lag | Use Case | Monitoring |
|-------------------|---------|----------|------------|
| **Strong Consistency** | < 1 second | Financial transactions, critical reads | Alert if > 1s |
| **Eventual Consistency** | < 5 seconds | Analytics, reporting, dashboards | Alert if > 10s |
| **Bounded Staleness** | < 30 seconds | Non-critical reads, caching | Alert if > 60s |

**Replication Lag Monitoring:**

```sql
-- Monitor replication lag
SELECT 
  client_addr,
  state,
  sync_state,
  EXTRACT(EPOCH FROM (now() - replay_lag)) as lag_seconds
FROM pg_stat_replication
WHERE lag_seconds > 1; -- Alert if lag > 1 second
```

**Read Replica Configuration:**

```yaml
# Neon read replica configuration
read_replicas:
  - name: analytics-replica
    lag_threshold: 5s
    use_case: analytics_queries
    auto_failover: false
  
  - name: critical-read-replica
    lag_threshold: 1s
    use_case: financial_transactions
    auto_failover: true
```

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

## 🧰 9. Zero-Downtime Migration Runbooks

### Migration Strategy Overview

**Zero-Downtime Migration Principles:**
1. **Additive Changes Only**: Add new columns/tables, never remove in single migration
2. **Backward Compatible**: New code must work with old schema, old code with new schema
3. **Gradual Rollout**: Deploy code changes before schema changes
4. **Data Migration in Background**: Move data asynchronously, not during migration
5. **Feature Flags**: Use flags to enable new features after migration complete

### Zero-Downtime Migration Runbook

**Scenario: Adding a new non-nullable column**

**Step 1: Add Column as Nullable**
```sql
-- Migration 001_add_new_field.sql
ALTER TABLE notes ADD COLUMN new_field TEXT NULL;
```

**Step 2: Deploy Code That Writes to Both Old and New Fields**
```typescript
// Code update (deployed while new_field is nullable)
export async function createNote(data: CreateNoteInput) {
  await db.insert(notes).values({
    ...data,
    old_field: data.fieldValue,
    new_field: data.fieldValue, // Write to both
  });
}
```

**Step 3: Backfill Existing Data (Background Job)**
```typescript
// Background job: backfill new_field from old_field
export async function backfillNewField() {
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const records = await db
      .select()
      .from(notes)
      .where(isNull(notes.new_field))
      .limit(batchSize)
      .offset(offset);

    if (records.length === 0) break;

    await db
      .update(notes)
      .set({ new_field: notes.old_field })
      .where(isNull(notes.new_field))
      .limit(batchSize);

    offset += batchSize;
    await sleep(100); // Rate limit
  }
}
```

**Step 4: Deploy Code That Only Uses New Field**
```typescript
// Code update (new_field now has data)
export async function createNote(data: CreateNoteInput) {
  await db.insert(notes).values({
    ...data,
    new_field: data.fieldValue, // Only write to new field
  });
}

// Stop writing to old_field
```

**Step 5: Add NOT NULL Constraint (After Backfill Complete)**
```sql
-- Migration 002_make_new_field_required.sql
-- Verify all rows have new_field
SELECT COUNT(*) FROM notes WHERE new_field IS NULL;
-- Should return 0

-- Add constraint
ALTER TABLE notes ALTER COLUMN new_field SET NOT NULL;
```

**Step 6: Remove Old Column (Next Release)**
```sql
-- Migration 003_drop_old_field.sql (after old code removed)
ALTER TABLE notes DROP COLUMN old_field;
```

### Migration Rollback Procedures

**Rollback Strategy:**

| Scenario | Rollback Method | Time Required | Data Loss Risk |
|----------|----------------|---------------|----------------|
| **Additive Migration** | Reverse migration SQL | < 5 minutes | None |
| **Data Migration** | Restore from backup | < 1 hour | Up to RPO (5min) |
| **Schema Change** | Restore from PITR | < 15 minutes | Up to RPO (5min) |
| **Failed Deployment** | Redeploy previous version | < 2 minutes | None |

**Rollback Checklist:**

```bash
# Rollback procedure
1. Stop new deployments
2. Verify issue with current migration
3. Determine rollback method (SQL reverse vs restore)
4. Notify team via Slack/PagerDuty
5. Execute rollback
6. Verify data integrity
7. Resume deployments
8. Document incident in post-mortem
```

### Migration Testing in CI/CD

**Pre-Production Migration Test:**

```yaml
# .github/workflows/migration-test.yml
name: Database Migration Test

on:
  pull_request:
    paths:
      - '**/drizzle/**/*.sql'
      - '**/db/schema.ts'

jobs:
  migration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Create ephemeral test database
      - name: Create test branch
        run: |
          neonctl branches create \
            --project vorklee-notes-prod \
            --name pr-${{ github.pr.number }} \
            --parent staging
      
      # Run migration
      - name: Run migration
        run: npx drizzle-kit push
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      
      # Verify migration
      - name: Verify schema
        run: npx drizzle-kit verify
      
      # Test data integrity
      - name: Run data integrity tests
        run: npm run test:db-integrity
      
      # Performance regression check
      - name: Check query performance
        run: npm run test:query-performance
      
      # Cleanup
      - name: Delete test branch
        if: always()
        run: |
          neonctl branches delete \
            --project vorklee-notes-prod \
            --name pr-${{ github.pr.number }}
```

### Database Sharding Decision Framework

**When to Consider Sharding:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Table Size** | > 100GB | Evaluate sharding |
| **Row Count** | > 1 billion rows | Consider sharding |
| **Query Performance** | P95 > 500ms despite indexing | Evaluate sharding |
| **Write Throughput** | > 10,000 writes/second | Consider sharding |
| **Storage Growth** | > 50GB/month | Plan for sharding |

**Sharding Strategies:**

| Strategy | Use Case | Complexity | Trade-offs |
|----------|----------|------------|-----------|
| **Horizontal (Range)** | Time-series data, sequential IDs | Low | Uneven distribution |
| **Horizontal (Hash)** | Even distribution needed | Medium | Cross-shard queries difficult |
| **Vertical** | Different access patterns per feature | Low | Fewer benefits |
| **Directory-Based** | Complex routing requirements | High | Single point of failure |

**Sharding Example: Notes Table by organization_id**

```sql
-- Shard 1: organizations 00000000-0000-0000-0000-7fffffffffff
CREATE TABLE notes_shard_1 PARTITION OF notes
FOR VALUES FROM ('00000000-0000-0000-0000-000000000000')
TO ('80000000-0000-0000-0000-7fffffffffff');

-- Shard 2: organizations 80000000-0000-0000-0000-ffffffffffff
CREATE TABLE notes_shard_2 PARTITION OF notes
FOR VALUES FROM ('80000000-0000-0000-0000-800000000000')
TO ('ffffffff-ffff-ffff-ffff-ffffffffffff');
```

**Sharding Implementation Checklist:**

- [ ] Analyze current table size and growth rate
- [ ] Identify sharding key (org_id, user_id, time-based)
- [ ] Design shard routing logic
- [ ] Implement shard-aware query layer
- [ ] Test cross-shard query performance
- [ ] Plan data migration strategy
- [ ] Implement monitoring for shard distribution
- [ ] Document shard rebalancing procedures

---

## 🧰 10. DevOps and CI/CD

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

### Migration Deployment Order

**Zero-Downtime Deployment Sequence:**

1. **Database Schema Changes** (if additive only)
   - Deploy migration to staging
   - Verify migration success
   - Deploy to production

2. **Application Code Deployment**
   - Deploy code that supports both old and new schema
   - Verify application works correctly

3. **Data Migration** (if needed)
   - Run background jobs to migrate data
   - Monitor migration progress
   - Verify data integrity

4. **Final Schema Changes** (non-nullable, constraints)
   - Deploy final migration after data migration complete
   - Verify constraints pass

5. **Code Cleanup** (next release)
   - Remove old field references
   - Drop deprecated columns  

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

**Key Enhancements in v5.3:**
- **Zero-Downtime Migration Runbooks**: Step-by-step procedures with rollback strategies
- **Connection Pool Auto-Scaling**: Automated scaling rules (scale up at 80% utilization, scale down at 30%)
- **Per-Query-Type SLAs**: Specific performance targets for SELECT, INSERT, UPDATE, DELETE operations
- **Automated Backup Testing**: Mandatory weekly restore tests with CI/CD integration
- **Read Replica Consistency SLAs**: Strong (<1s), eventual (<5s), bounded staleness (<30s) targets
- **Database Sharding Decision Framework**: Clear criteria and strategies for when to shard (100GB+, 1B rows)
- **Performance Regression Detection**: Automated CI/CD checks to prevent query slowdowns

**Previous Enhancements:**
- **Enhanced RLS**: Role-based policies with granular CRUD permissions
- **Connection Pooling**: PgBouncer with transaction mode, 25 connections per service
- **Performance SLIs**: P95 latency < 100ms, P99 < 250ms with continuous monitoring
- **Disaster Recovery**: RTO < 1 hour, RPO < 5 minutes with cross-region replication
- **Backup Encryption**: AES-256 + CMK with 90-day key rotation
- **Compliance**: GDPR crypto-shredding, HIPAA 6-year logs, SOC2 audit trails
- **Data Anonymization**: K-anonymity and differential privacy for analytics
- **Auto-Scaling**: Dynamic compute (1-8 vCPUs) based on 70% CPU threshold

It enforces isolation, compliance, scalability, and operational excellence — ensuring long-term stability, security, and zero-downtime deployments.

---

**End of File — 04_Database_and_Infrastructure_Blueprint_v5.md**
