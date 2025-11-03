---
version: "5.2"
maintainer: "Vorklee2 Security & Auth Engineering Team"
last_updated: "2025-11-03 03:35:55 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 🔐 03_Core_Identity_and_Auth_Architecture_v5.md  
## Centralized Identity, Authentication, and Authorization System for Vorklee2

---

## 🧭 Purpose
This document defines the **Core Identity Service architecture** — the system responsible for authentication, authorization, and organization-level access control across all Vorklee2 applications.

It serves as the *single source of truth* for users, organizations, apps, and their permissions.

---

## 🧱 1. Core Identity Project

| Layer | Description |
|--------|--------------|
| **Neon Project** | `vorklee-core-prod` |
| **Schema** | `core` |
| **Purpose** | Centralized authentication, app permissions, and organization ownership |
| **Integrations** | All app projects (Notes, Attendance, HR, etc.) |

### Core Responsibilities
- Manage user authentication (JWT / SSO / OAuth2).  
- Handle organization creation and plan management.  
- Define app-specific roles and permissions.  
- Provide a unified API for identity verification.  
- Emit events to downstream apps on user/org changes.

---

## ⚙️ 2. Database Schema

```sql
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  region TEXT DEFAULT 'us',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE core.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES core.organizations(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE core.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE core.app_permissions (
  user_id UUID REFERENCES core.users(id),
  org_id UUID REFERENCES core.organizations(id),
  app_id UUID REFERENCES core.apps(id),
  role TEXT,
  PRIMARY KEY (user_id, app_id, org_id)
);
```

---

## 🔐 3. Authentication Flow

### Login Sequence
1. User logs in via `/auth/login` endpoint.  
2. Credentials verified against `core.users`.  
3. A **JWT** is issued with claims:
   ```json
   {
     "user_id": "uuid",
     "org_id": "uuid",
     "apps": ["notes", "attendance"],
     "roles": { "notes": "admin", "attendance": "viewer" },
     "exp": 1728000000
   }
   ```
4. JWT is signed using RS256 with Core private key.  
5. Public key accessible to all apps via `/auth/public-key`.  

### Verification
- Every app (e.g., Notes, HR) verifies JWT signature via Core public key.  
- If valid → proceed with request; else → reject with HTTP 401.  

---

## 🧩 4. Authorization Strategy

| Resource | Controlled By | Example |
|-----------|----------------|----------|
| **App Access** | `core.app_permissions` | Check `notes` in token |
| **Org Access** | `org_id` claim in JWT | Only same org users |
| **Feature Access** | Role claims | `role = admin` |
| **Data Isolation** | `org_id` filtering | RLS at app level |

Authorization logic is consistent across all apps via shared SDK (`@vorklee/auth-client`).

---

## 🔑 5. JWT Claims Standard

| Claim | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Global user identifier |
| `org_id` | UUID | Organization ID |
| `apps` | Array | Apps user can access |
| `roles` | Object | Per-app role map |
| `iat` | Integer | Token issue time |
| `exp` | Integer | Expiration timestamp |

**Refresh Tokens**  
- Stored securely in Redis.  
- 7-day expiry, rotated on use.  
- Bound to user + device fingerprint.

---

## 🧠 6. API Endpoints

| Endpoint | Method | Description |
|-----------|---------|--------------|
| `/auth/login` | POST | Validate credentials and issue JWT |
| `/auth/refresh` | POST | Issue new JWT using refresh token |
| `/auth/verify` | POST | Validate provided token |
| `/auth/public-key` | GET | Retrieve JWT public key |
| `/orgs` | CRUD | Manage organizations |
| `/users` | CRUD | Manage users under org |

All endpoints require HMAC-signed internal headers for inter-service communication.

---

## 🔔 7. Event Broadcasting

When users or organizations change, Core emits events:

| Event | Payload | Consumers |
|--------|----------|------------|
| `user.created` | user_id, org_id | Notes, Attendance, HR |
| `user.deleted` | user_id | All apps |
| `org.updated` | org_id | All apps |
| `role.updated` | user_id, app_id, role | Related app |

These are pushed via Kafka or RabbitMQ and consumed asynchronously.

---

## 🔒 8. Security Controls

- All password hashes use Argon2id with per-user salts.  
- JWT private key stored in Vault only accessible by Core container.  
- API requests between services authenticated via HMAC headers.  
- Audit trail for login/logout actions stored in `core.audit_logs`.  
- RLS (Row-Level Security) enabled for multi-tenant queries.

---

## 🧾 9. Compliance & Logging

| Layer | Logged Data | Retention |
|--------|--------------|------------|
| **Auth Logs** | user_id, ip, timestamp | 90 days |
| **Audit Logs** | all identity changes | 1 year |
| **System Events** | Kafka topic metadata | 7 days |
| **PII Storage** | Encrypted at rest | Until user deletion |

All logs export to the centralized analytics project (`vorklee-analytics-prod`).

---

## ✅ Summary

The **Core Identity Service** is the cornerstone of the Vorklee2 platform — enabling secure authentication, centralized authorization, and organization-based multi-tenancy.  
Every other service (Notes, Attendance, HR) trusts Core as the sole authority on identity and access.

---

**End of File — 03_Core_Identity_and_Auth_Architecture_v5.md**
