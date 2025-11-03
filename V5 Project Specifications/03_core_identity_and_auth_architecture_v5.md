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

### Password Security
All passwords are hashed using **Argon2id** with the following parameters:
```javascript
{
  type: argon2id,
  memoryCost: 65536,      // 64 MB
  timeCost: 3,            // 3 iterations
  parallelism: 4,         // 4 threads
  saltLength: 16,         // 16 bytes (128-bit salt)
  hashLength: 32          // 32 bytes (256-bit hash)
}
```
Each user has a unique random salt generated at account creation.

### Login Sequence
1. User logs in via `/auth/login` endpoint.
2. **Rate Limiting Applied**: 5 failed attempts → 15-minute account lockout + CAPTCHA required.
3. Credentials verified against `core.users` using Argon2id comparison.
4. **Device Fingerprinting**: Generate fingerprint from User-Agent + IP + TLS fingerprint.
5. A **JWT** is issued with enhanced claims:
   ```json
   {
     "jti": "uuid",                    // JWT ID for replay prevention
     "user_id": "uuid",
     "org_id": "uuid",
     "apps": ["notes", "attendance"],
     "roles": { "notes": "admin", "attendance": "viewer" },
     "kid": "2025-01-v3",              // Key ID for rotation
     "device_id": "fingerprint_hash",
     "iat": 1704067200,                // Issued at
     "exp": 1704153600                 // Expires in 24 hours
   }
   ```
6. JWT is signed using **RS256** with Core private key (4096-bit RSA).
7. Refresh token generated and stored in Redis with 7-day TTL.
8. Public key accessible to all apps via `/auth/public-key?kid=2025-01-v3`.

### JWT Key Rotation Strategy
- **Active Keys**: 2 keys maintained (current + previous)
- **Rotation Schedule**: Every 90 days
- **Key ID (kid)**: Format `YYYY-MM-vN` (e.g., `2025-01-v3`)
- **Transition Period**: 7 days overlap where both keys validate tokens
- **Storage**: Private keys in HashiCorp Vault with audit logging
- **Algorithm**: RS256 (RSA + SHA-256), 4096-bit keys

**Key Rotation Process:**
```
Day 0:   Generate new key pair → Store in Vault
Day 1:   Start signing new tokens with new key (kid=2025-01-v4)
Day 1-7: Validate tokens from both old (v3) and new (v4) keys
Day 8:   Revoke old key (v3) → Archive in cold storage
```

### Refresh Token Security
- **Storage**: Redis with encryption at rest
- **TTL**: 7 days
- **Binding**: Tied to `user_id + device_id + IP subnet`
- **Rotation**: New refresh token issued on each use (single-use tokens)
- **Reuse Detection**: If revoked token used → revoke all sessions → alert security team

### Verification
- Every app (e.g., Notes, HR) verifies JWT signature via Core public key.
- **Validation Steps**:
  1. Check signature with public key matching `kid`
  2. Verify `exp` (expiration) is in future
  3. Verify `jti` not in Redis blacklist (for early revocation)
  4. Verify `iat` (issued at) is not in future
  5. Check token not used before `nbf` (not before, if present)
- If valid → proceed with request; else → reject with HTTP 401.

### Rate Limiting on Auth Endpoints

| Endpoint | Anonymous | Authenticated | Lockout Policy |
|----------|-----------|---------------|----------------|
| `/auth/login` | 5/15min per IP | N/A | 15min after 5 failures |
| `/auth/register` | 3/hour per IP | N/A | 1 hour after 3 attempts |
| `/auth/refresh` | N/A | 10/min per token | Revoke token after abuse |
| `/auth/verify` | 100/min per IP | 1000/min per token | Alert after threshold |
| `/auth/logout` | N/A | 10/min per user | N/A |  

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

### Standard Claims (RFC 7519)

| Claim | Type | Required | Description |
|--------|------|----------|-------------|
| `jti` | UUID | Yes | JWT ID - unique identifier for replay prevention |
| `iss` | String | Yes | Issuer - always "vorklee-core-identity" |
| `sub` | UUID | Yes | Subject - same as user_id |
| `aud` | Array | Yes | Audience - target services ["notes", "core"] |
| `iat` | Integer | Yes | Issued At - Unix timestamp |
| `exp` | Integer | Yes | Expiration - Unix timestamp (iat + 24h) |
| `nbf` | Integer | No | Not Before - Unix timestamp (optional) |

### Custom Claims (Vorklee-Specific)

| Claim | Type | Required | Description |
|--------|------|----------|-------------|
| `user_id` | UUID | Yes | Global user identifier |
| `org_id` | UUID | Yes | Organization ID |
| `apps` | Array | Yes | Apps user can access |
| `roles` | Object | Yes | Per-app role map: `{"notes": "admin"}` |
| `kid` | String | Yes | Key ID for rotation: `2025-01-v3` |
| `device_id` | String | Yes | Device fingerprint hash |
| `session_id` | UUID | Yes | Session identifier for revocation |

### Token Size Optimization
- Maximum JWT size: 4KB (to fit in HTTP headers)
- Role claims compressed using short codes when > 10 apps
- Use token introspection endpoint for full claims if needed

**Refresh Tokens**
- Format: Opaque random 256-bit tokens (not JWTs)
- Stored securely in Redis `redis-session` instance
- Structure in Redis:
  ```json
  {
    "token_hash": "sha256(...)",
    "user_id": "uuid",
    "device_id": "fingerprint",
    "ip_subnet": "1.2.3.0/24",
    "issued_at": "timestamp",
    "expires_at": "timestamp",
    "used": false
  }
  ```
- 7-day expiry, rotated on use (single-use pattern)
- Bound to user + device fingerprint + IP subnet
- All tokens revoked on password change

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

### Password Security
- **Algorithm**: Argon2id (memory-hard, side-channel resistant)
- **Parameters**: 64MB memory, 3 iterations, 4 threads
- **Salt**: 16 bytes (128-bit) unique per user
- **Hash**: 32 bytes (256-bit) output
- **Pepper**: Additional server-side secret (rotated yearly)

### Key Management
- **JWT Private Keys**: Stored in HashiCorp Vault with strict ACL
  - Access: Core Identity service only
  - Rotation: Every 90 days with 7-day overlap
  - Audit: All key access logged
  - Backup: Encrypted cold storage for disaster recovery
- **Refresh Token Secrets**: Stored in Vault, separate from JWT keys
- **HMAC Secrets**: Per-service secrets for inter-service auth
- **Encryption Keys**: Customer-managed keys (CMK) via AWS KMS

### Inter-Service Authentication
- **Method**: HMAC-SHA256 request signing
- **Headers**:
  ```
  X-Service-Name: notes-service
  X-Service-Signature: sha256=abc123...
  X-Request-Timestamp: 1704067200
  ```
- **Signature Calculation**: `HMAC-SHA256(secret, method + path + timestamp + body)`
- **Timestamp Validation**: Reject requests > 5 minutes old (replay prevention)
- **Secret Rotation**: Every 90 days with zero-downtime transition

### Multi-Factor Authentication (MFA)
- **Supported Methods**: TOTP (Google Authenticator), SMS, Email
- **Required For**: Admin roles, production access, sensitive operations
- **Backup Codes**: 10 single-use codes generated at MFA setup
- **Recovery**: Time-delayed recovery process (24-hour delay + email verification)

### Session Management
- **Session Storage**: Redis `redis-session` instance
- **Session ID**: 256-bit cryptographically random
- **TTL**: 24 hours (auto-extended on activity)
- **Concurrent Sessions**: Max 5 per user (oldest removed when exceeded)
- **Revocation**: Individual session or all sessions per user
- **Activity Tracking**: Last active timestamp, IP, User-Agent

### Audit Trail
All authentication events logged to `core.audit_logs`:
```json
{
  "event_type": "auth.login",
  "user_id": "uuid",
  "org_id": "uuid",
  "ip_address": "1.2.3.4",
  "user_agent": "...",
  "device_id": "fingerprint",
  "mfa_used": true,
  "success": true,
  "failure_reason": null,
  "timestamp": "ISO8601",
  "session_id": "uuid"
}
```

**Logged Events:**
- `auth.login` (success/failure with reason)
- `auth.logout`
- `auth.token_refresh`
- `auth.token_revoked`
- `auth.password_changed`
- `auth.mfa_enabled`
- `auth.mfa_disabled`
- `auth.suspicious_activity`

### Data Protection
- **RLS (Row-Level Security)**: Enabled for multi-tenant queries
- **Encryption at Rest**: AES-256 for all sensitive data
- **Encryption in Transit**: TLS 1.3 with perfect forward secrecy
- **PII Handling**: Encrypted fields for email, phone, address
- **Right to Erasure**: Automated GDPR compliance workflow

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

The **Core Identity Service** is the cornerstone of the Vorklee2 platform — enabling enterprise-grade authentication, centralized authorization, and organization-based multi-tenancy.

**Security Highlights:**
- **Password Security**: Argon2id with 64MB memory, per-user salts, and server-side pepper
- **JWT Security**: RS256 4096-bit keys, 90-day rotation, replay prevention via jti claims
- **MFA Support**: TOTP, SMS, email with backup codes and recovery workflow
- **Session Security**: Single-use refresh tokens, device binding, IP subnet validation
- **Rate Limiting**: Adaptive limits preventing brute-force attacks
- **Comprehensive Auditing**: All auth events logged with full context for 1 year
- **Zero Trust**: Every request verified, least privilege access, continuous monitoring

Every other service (Notes, Attendance, HR) trusts Core as the sole authority on identity and access.

---

**End of File — 03_Core_Identity_and_Auth_Architecture_v5.md**
