---
version: "5.2"
maintainer: "Vorklee2 Product & Engineering Team"
last_updated: "2025-11-03 03:41:08 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 📝 09_Notes_App_Architecture_Blueprint_v5.md  
## Technical Architecture and System Design for Vorklee2 Notes Application

---

## 🧭 Purpose
This document defines the **system architecture, database schema, API design, and CI/CD integration** for the **Vorklee2 Notes App (v5.2)** — a modular service deployed under the enterprise multi-project architecture.

The Notes App operates as an independent Neon project (`vorklee-notes-prod`) but integrates seamlessly with **Core Identity** for authentication, authorization, and user management.

---

## 🧱 1. Overview

| Layer | Technology | Description |
|--------|-------------|-------------|
| **Frontend** | Next.js 14 + React Server Components | Modern UI and client rendering |
| **Backend** | Node.js 20 / Edge Functions | Note creation and retrieval APIs |
| **Database** | Neon Postgres (Serverless) | Persistent data storage |
| **Cache** | Redis Cloud | Caching user and note lists |
| **Auth** | JWT via Core Identity | Secure and centralized login |
| **Search** | Postgres Full-Text + OpenSearch (optional) | Content indexing |
| **Storage** | S3 / Cloudflare R2 | File attachments |

---

## ⚙️ 2. Database Design (`vorklee-notes-prod`)

### Schema: `public`

```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL
);

CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  file_url TEXT,
  file_type TEXT,
  size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes
```sql
CREATE INDEX idx_notes_org_user ON public.notes(org_id, user_id);
CREATE INDEX idx_tags_note_id ON public.tags(note_id);
CREATE INDEX idx_notes_search ON public.notes USING GIN(to_tsvector('english', content));
```

### RLS Policy
```sql
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON public.notes
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

---

## 🧩 3. Authentication & Authorization Flow

1. User logs in through **Core Identity** → receives JWT.  
2. Notes App verifies token signature with Core’s public key.  
3. `user_id` and `org_id` extracted from token claims.  
4. RLS ensures data isolation per organization.  
5. App permissions validated using Core API (`/auth/verify`).

Example verification request:
```bash
POST https://core.vorklee.com/auth/verify
Authorization: Bearer <JWT>
```

Response:
```json
{ "valid": true, "user_id": "uuid", "org_id": "uuid", "roles": {"notes": "admin"} }
```

---

## 🧠 4. API Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/api/v1/notes` | List notes for user/org |
| `GET` | `/api/v1/notes/<built-in function id>` | Get single note |
| `POST` | `/api/v1/notes` | Create new note |
| `PUT` | `/api/v1/notes/<built-in function id>` | Update note |
| `DELETE` | `/api/v1/notes/<built-in function id>` | Delete note |
| `GET` | `/api/v1/tags` | Fetch tags |
| `POST` | `/api/v1/attachments` | Upload attachment |

All routes are protected via middleware verifying JWT + role permissions.

---

## 🔄 5. CI/CD Pipeline

**Workflow:** GitHub Actions → Neon → Vercel

```yaml
name: Notes App CI/CD
on:
  push:
    branches: [main]
jobs:
  build-test-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint && npm run test
      - run: npx drizzle-kit push
      - run: npx vercel deploy --prod
```

- Ephemeral branches automatically create **temporary Neon DBs** for PRs.  
- On merge → branch deleted + deployment triggered.  

---

## 📦 6. Caching and Performance

| Component | Strategy |
|------------|-----------|
| **Redis Cache** | Store recent notes per user (`notes:user_id`) |
| **Cache Invalidation** | On note update/delete |
| **Content Search** | Postgres Full-Text Index or OpenSearch |
| **Pagination** | Cursor-based (`?after=id`) for large datasets |

---

## 🔔 7. Event Emission

The Notes app emits events for integration and analytics.

| Event | Payload | Consumer |
|--------|----------|-----------|
| `notes.created` | note_id, user_id, org_id | Analytics, Core |
| `notes.updated` | note_id | Analytics |
| `notes.deleted` | note_id | Analytics, Core |

Events sent via Kafka or HTTP Webhook → Core and Analytics.

---

## 🔒 8. Security

### Authentication & Authorization
- **JWT Validation**: RS256 verification with Core's public key (kid-based key rotation support)
- **Rate Limiting**: Tiered - Auth: 100/min, Pro: 500/min, Enterprise: 1000/min
- **HMAC Signing**: SHA-256 signatures for internal service calls with 5-min timestamp validation
- **MFA**: Required for admin operations (delete, bulk actions)

### API Security
- **Idempotency**: Support for Idempotency-Key header on POST/PUT operations
- **Request Signing**: Sensitive operations (bulk delete) require HMAC signature
- **Circuit Breaker**: 5 failures in 30s → open circuit → fast fail
- **CORS**: Whitelist specific domains, no wildcard in production
- **Input Validation**: Zod schemas for all request payloads

### Database Security
- **Enhanced RLS**: Role-based policies (admin, editor, viewer) with CRUD-level permissions
- **Connection Pooling**: PgBouncer with 25 connections, transaction mode
- **Encryption**: AES-256 at rest with CMK, TLS 1.3 in transit
- **Backup**: Encrypted with CMK, RTO < 1hr, RPO < 5min

### File Upload Security
- **Scanning**: VirusTotal API scan before accepting upload
- **File Type Validation**: Whitelist allowed MIME types
- **Size Limits**: 10MB per file, 100MB total per note
- **Storage**: S3/R2 with presigned URLs (1-hour expiry)
- **Malware**: Quarantine suspicious files, alert security team

### Data Protection
- **PII Handling**: Redact email, phone, IP (keep first octet only) in logs
- **Audit Logging**: All operations logged with user_id, org_id, trace_id
- **Soft Delete**: 90-day retention before crypto-shredding
- **RLS**: Enforced at database level via `app.current_org_id` and `app.current_user_id`
- **Field Encryption**: Sensitive note content can be encrypted at field level (opt-in)

Example audit log (Core):
```json
{
  "app": "notes",
  "event": "note_created",
  "user_id": "uuid",
  "org_id": "uuid",
  "timestamp": "2025-11-03T12:00:00Z"
}
```

---

## 🧮 9. Analytics Integration

- Notes events forwarded to `vorklee-analytics-prod` via ETL.  
- Aggregations include total notes per org, user activity rate, attachment usage.  
- BI dashboards built using Metabase.  

Example metric:
```sql
SELECT org_id, COUNT(*) AS note_count FROM notes GROUP BY org_id;
```

---

## 📊 10. Performance & Monitoring

### Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Latency P95** | < 250ms | Grafana + Sentry |
| **API Latency P99** | < 500ms | Alert if exceeded |
| **DB Query P95** | < 100ms | Neon Insights |
| **Cache Hit Rate** | > 80% | Redis metrics |
| **Error Rate** | < 0.1% | Real-time alerts |
| **Availability** | 99.9% | Uptime monitoring |

### Observability

- **Structured Logging**: JSON format with trace_id, span_id, user_id, org_id
- **Distributed Tracing**: OpenTelemetry integration for end-to-end request tracing
- **Metrics**: Prometheus metrics exported, visualized in Grafana
- **Alerting**: PagerDuty for P0/P1 incidents, Slack for P2/P3

### Caching Strategy

- **Redis Cache**: User note lists cached for 5 minutes
- **Cache Invalidation**: On note create/update/delete
- **Cache Keys**: `notes:list:{user_id}:{page}:{filters_hash}`
- **Circuit Breaker**: If Redis down, bypass cache (degrade gracefully)

---

## ✅ 11. Summary

The **Notes App** is a fully modular, secure, and API-driven service within the Vorklee2 platform.

**Key Features:**
- **Enterprise Security**: Enhanced RLS, JWT validation, rate limiting, file scanning
- **High Performance**: < 250ms P95 latency, Redis caching, PgBouncer pooling
- **Comprehensive Audit**: All operations logged with full context for compliance
- **Disaster Recovery**: RTO < 1hr, RPO < 5min with encrypted backups
- **Scalability**: Auto-scaling compute, connection pooling, event-driven architecture
- **Integration**: Seamless with Core Identity, Analytics, and future modules

It adheres to the multi-project Neon model, integrating tightly with Core Identity and Analytics for end-to-end scalability and compliance.

---

**End of File — 09_Notes_App_Architecture_Blueprint_v5.md**
