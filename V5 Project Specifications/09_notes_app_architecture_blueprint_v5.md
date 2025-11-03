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

- JWT authentication for all endpoints.  
- HMAC validation for internal service calls.  
- File uploads scanned via VirusTotal API.  
- Rate limiting: 100 req/min per user.  
- Logs redacted for PII before export.  
- RLS and audit logging enabled on all tables.

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

## ✅ 10. Summary

The **Notes App** is a fully modular, secure, and API-driven service within the Vorklee2 platform.  
It adheres to the multi-project Neon model, integrating tightly with Core Identity and Analytics for end-to-end scalability and compliance.

---

**End of File — 09_Notes_App_Architecture_Blueprint_v5.md**
