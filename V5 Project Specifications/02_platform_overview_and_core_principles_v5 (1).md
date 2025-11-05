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

## 🤖 11. AI Development Instructions (Complete Reference)

### Purpose

This section provides **comprehensive development instructions** for AI assistants and developers building features for the Vorklee2 platform. It consolidates all V5.4 specifications into actionable guidelines that ensure every feature meets enterprise standards.

**When to use**: Reference this section when developing any new feature, app module, or infrastructure component.

---

### Core Development Principles

Always guide toward developing **enterprise-grade, future-proof, industry-standard solutions** for the **Vorklee2 multi-app SaaS platform** using these principles:

#### 1. Technology Stack & Framework (Non-Negotiable)

**Framework & Monorepo:**
- **Framework**: Next.js 15 (App Router, React Server Components)
- **Monorepo**: Turborepo with shared packages:
  - `@core-auth` - JWT authentication, MFA, device fingerprinting, zero trust engine
  - `@core-utils` - Logging (structured JSON), rate limiting, validation (Zod)
  - `@core-audit` - Audit logging for compliance (1yr standard, 6yr PHI)
  - `@core-analytics` - Usage tracking, business metrics (PostHog)
  - `@core-billing` - Subscription management, feature gating
- **Language**: TypeScript 5.6+ (100% typed, strict mode, no `any` types allowed)
- **Database**: NeonDB (PostgreSQL) - separate Neon project per app
- **ORM**: Drizzle ORM with type-safe schema, migrations via `drizzle-kit push`
- **Cache**: Redis for sessions, API responses, real-time pub/sub, >80% hit rate target
- **UI**: Material UI v7, mobile-first responsive design, WCAG 2.1 AA accessibility
- **State**: TanStack Query (server state), React Context (client state)

**Multi-Project Neon Architecture:**
```typescript
// Neon Projects (Compute + Storage Isolation)
vorklee-core-prod       // Identity, auth, orgs, permissions
vorklee-notes-prod      // Notes, notebooks, tags, attachments
vorklee-attendance-prod // Attendance records, shifts
vorklee-hr-prod         // Employees, payroll, leaves
vorklee-analytics-prod  // Cross-app analytics, BI
```

**Database Standards:**
- **Conventions**: UUIDs for PKs, `snake_case` tables/columns, `created_at`/`updated_at`/`deleted_at` timestamps
- **Audit Fields**: Every table includes `created_by` and `updated_by` (references `core.users.id`)
- **Enhanced RLS**: CRUD-level policies with role checks (SELECT/INSERT/UPDATE/DELETE)
- **Connection Pooling**: PgBouncer (25 connections per service)
- **DB Users**: `service_rw` (runtime), `migration_user` (migrations only), `readonly_user` (analytics)
- **Encryption**: TLS 1.3 in-transit, AES-256-GCM at-rest, field-level for PII/PHI

---

#### 2. Security & Compliance (Zero-Trust Architecture - 100% Industry Standard)

**Zero Trust Implementation:**
```typescript
// Never Trust, Always Verify - Every Request Evaluated
✅ Risk-based adaptive authentication (0.0-1.0 risk score)
✅ Device posture monitoring (OS version, antivirus, disk encryption, jailbreak detection)
✅ Continuous verification (re-check every 4 hours)
✅ Micro-segmentation (service mesh: Istio/Linkerd with mTLS)
✅ Least privilege access (just-in-time permissions, session expiry based on risk)
```

**Risk Score Calculation:**
- Known device: -0.3 risk
- Unusual location: +0.4 risk
- Impossible travel: +0.9 risk (VPN detection)
- No MFA: +0.2 risk
- Risk > 0.7 → Require step-up MFA

**Device Posture Checks:**
- OS version (must be latest-2 versions)
- Antivirus running + updated definitions
- Disk encrypted (BitLocker, FileVault, LUKS)
- Screen lock enabled
- Jailbreak/root detection
- MDM enrollment (for corporate devices)

**Authentication & Authorization:**
- **JWT**: RS256 with 4096-bit keys, 90-day rotation, jti-based replay prevention, 24h expiry
- **MFA**: TOTP/SMS/Email + Biometric (FaceID, TouchID, Fingerprint) + Device fingerprinting
- **Password Security**: Argon2id (64MB memory, 3 iterations) + per-user salt + server pepper
- **Session Management**: httpOnly cookies, SameSite=Strict, 7-day refresh tokens
- **Authorization**: RBAC + ABAC + Database RLS with CRUD permissions
- **Inter-Service Auth**: HMAC request signing (sha256) with timestamp + nonce validation (5-minute window)

**SIEM & SOAR (Security Operations):**
```typescript
// Centralized Security Monitoring
✅ Elastic Stack (3-node Elasticsearch cluster)
✅ 15+ threat detection rules (Sigma-based)
✅ 8+ automated SOAR playbooks (incident response)
✅ Threat intelligence feeds (8+ external sources)
✅ Mean time to detect: <5 minutes
✅ Mean time to respond: <15 minutes (automated)
```

**Security Incident Response SLAs:**
- PII Exposure: < 1 hour (immediate halt + data purge + incident report)
- Model Failure: < 5 minutes (fallback to manual + alert engineering)
- Security Breach: < 30 minutes (revoke keys + audit logs + security review)
- Hallucination: < 24 hours (flag output + human review + model retraining)

**Compliance Automation:**

**GDPR:**
- Automated DSAR (Data Subject Access Request) processing with export API (JSON/CSV/PDF)
- Right to Erasure: Soft delete → Hard delete (90 days) → Crypto-shredding
- Consent management: Granular tracking with audit logs
- Data portability: Self-service export portal

**SOC2 Type II:**
- Quarterly automated evidence collection
- MFA enforcement: 100% admin users
- Backup verification: Weekly automated restore tests
- Access review: Monthly automated reports
- Continuous monitoring: Real-time compliance dashboards

**HIPAA:**
- BAA (Business Associate Agreement) tracking with 30-day expiry reminders
- PHI access logging: 6-year retention (compliance requirement)
- Minimum necessary access: Role-based data masking
- Breach notification: Automated workflow (<72 hours)

**Supply Chain Security:**
- GPG-signed commits (mandatory for production)
- SBOM (Software Bill of Materials) generation
- SLSA Level 3 provenance
- Dependency scanning: Snyk + Dependabot
- SAST/DAST: 100% coverage (Snyk, OWASP ZAP)

---

#### 3. API & Event-Driven Architecture

**REST API Standards:**
```typescript
// API Design Patterns
Base URL: https://api.vorklee.com/{service}/v1
Naming: Plural nouns, kebab-case (/notes, /users)
Methods: GET, POST, PUT, PATCH, DELETE
Versioning: Path-based (/v1/, /v2/)
Pagination: ?page=1&limit=20 (default: 50, max: 100)
Sorting: ?sort=created_at:desc
Filtering: ?status=active&org_id=uuid
Timeout: 30 seconds
```

**Response Format:**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Example" },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2025-11-05T00:00:00Z"
  }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Invalid or expired token"
  }
}
```

**Rate Limiting (Tiered):**
| Tier | Auth | Limits | Burst | Identification |
|------|------|--------|-------|----------------|
| Anonymous | None | 10/min | 20 req | IP address |
| Authenticated | JWT | 100/min | 150 req | user_id |
| Pro | JWT + Plan | 500/min | 750 req | user_id |
| Enterprise | JWT + Plan | 1000/min | 2000 req | user_id + org_id |
| Internal | HMAC | Unlimited | N/A | service_name |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1704067200
X-RateLimit-Retry-After: 45
```

**Idempotency Keys (POST/PUT/PATCH):**
```http
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```
- Store key + response hash in Redis (24-hour TTL)
- Duplicate request → Return cached response (409 Conflict)

**HMAC Request Signing (Inter-Service):**
```typescript
const payload = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}`;
const signature = crypto.createHmac('sha256', SERVICE_SECRET).update(payload).digest('hex');
```
Headers: `X-Service-Signature`, `X-Request-Timestamp`, `X-Request-Nonce`

**Event Bus (Kafka/RabbitMQ):**
```typescript
// Event Schema
{
  "event_type": "notes.created",
  "timestamp": "ISO8601",
  "trace_id": "uuid",
  "payload": { "note_id": "uuid", "user_id": "uuid", "org_id": "uuid" }
}
```

---

#### 4. Observability (Three Pillars - 100% Production Visibility)

**1. Structured Logging:**
```typescript
// JSON format with correlation IDs
{
  "level": "info",
  "message": "Note created",
  "service": "notes",
  "environment": "production",
  "trace_id": "uuid",
  "span_id": "uuid",
  "user_id": "uuid",
  "org_id": "uuid",
  "timestamp": "ISO8601"
}
```
**Transports**: Console (dev), File (JSON), Elasticsearch (SIEM), Datadog (APM)
**Retention**: 90 days (standard), 7 years (audit logs)

**2. Prometheus Metrics:**
```typescript
// Standard metrics
- http_request_duration_seconds (histogram)
- http_requests_total (counter)
- database_query_duration_seconds (histogram)
- cache_hit_rate (gauge)
- notes_created_total (counter - business metric)
- active_users (gauge)
- apdex_score (gauge - application performance index)
```

**3. Distributed Tracing:**
```typescript
// OpenTelemetry auto-instrumentation
- End-to-end request tracing
- Jaeger/Tempo for storage
- Intelligent sampling: 10% GET, 100% POST/PUT/DELETE
- Trace retention: 7 days
```

**SLO Monitoring:**
```yaml
Availability:
  SLI: "Ratio of successful requests to total"
  SLO: 99.9% (43.2 min downtime/month)

Latency P95:
  SLI: "95th percentile request duration"
  SLO: <250ms

Error Budget:
  Total: 43.2 minutes/month
  Tracking: Real-time dashboard
```

**Alerting**: 20+ Prometheus rules, PagerDuty escalation (4 levels), runbooks linked to all alerts

---

#### 5. Performance & Scalability

**Performance Targets (All Must Be Met):**
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Latency P95 | <250ms | 180ms | ✅ 28% better |
| API Latency P99 | <500ms | 380ms | ✅ 24% better |
| Database P95 | <100ms | 75ms | ✅ 25% better |
| Uptime | 99.9% | 99.95% | ✅ 5x error budget |
| Concurrent Users | 100k+ | 150k tested | ✅ 50% headroom |
| API Throughput | 10k req/s | 15k tested | ✅ 50% headroom |

**Disaster Recovery:**
```yaml
RTO (Recovery Time Objective): < 1 hour
RPO (Recovery Point Objective): < 5 minutes
Cross-Region Failover: Automatic within 5 minutes
Backup Verification: Weekly automated restore tests
DR Drills: Quarterly full failover exercises
```

**Resilience Patterns:**
- Circuit breakers (fail-fast after 5 consecutive errors)
- Exponential backoff retries (max 3 attempts)
- Bulkhead pattern (isolate failures)
- Chaos engineering (Chaos Monkey for failure injection)

---

#### 6. Mobile & Progressive Web App

**PWA Standards:**
```typescript
✅ Service Worker: Cache-First (static), Network-First (API)
✅ Web App Manifest: Installable, theme colors, app icons
✅ Offline Support: IndexedDB cache, background sync queue
✅ Push Notifications: Web Push API with user permission
✅ Lighthouse PWA Score: Target >90 (current: 95)
```

**React Native (iOS + Android):**
```typescript
✅ Code sharing: 80% business logic, 20% platform-specific UI
✅ Offline-first: SQLite cache + background sync
✅ Biometric auth: FaceID, TouchID, Fingerprint
✅ Push notifications: FCM (Android) + APN (iOS)
✅ Camera integration: Document scanning
✅ Voice notes: WhisperX transcription
✅ App launch time: <2 seconds
```

**Mobile-First Design:**
- **Breakpoints**: <640px (mobile), 640-1024px (tablet), 1024+ (desktop)
- **Touch Targets**: 48×48px minimum (iOS/Android standard)
- **Typography**: Responsive scaling with clamp()
- **Performance Budget**: <1MB total, Lighthouse >90

---

#### 7. Testing Strategy (Test Pyramid)

| Level | Coverage Target | Tools | Execution |
|-------|-----------------|-------|-----------|
| **Unit** | 80%+ | Jest, Vitest | Every commit |
| **Integration** | 70%+ | Jest + Supertest | Every PR |
| **E2E** | Critical paths | Playwright, Cypress | Pre-deploy |
| **Performance** | SLO validation | k6, Artillery | Weekly + pre-release |
| **Security** | 100% | Snyk, OWASP ZAP | Every commit |
| **Mutation** | Quality check | Stryker | Weekly |

**Performance Test Thresholds (k6):**
```javascript
thresholds: {
  http_req_duration: ['p(95)<250'], // 95% < 250ms
  http_req_failed: ['rate<0.01'],   // <1% errors
}
```

---

#### 8. AI & Automation Standards

**AI Governance:**
```typescript
// AI safety principles
✅ Transparency: All AI actions logged to core.audit_logs
✅ Human oversight: Developers review all AI-generated code before merge
✅ PII redaction: Automatic before prompt submission
✅ Access control: Isolated API keys, 90-day rotation
✅ Data protection: Only "Public" and "Internal" data allowed in prompts
```

**AI Toolchain:**
- GPT-5-Enterprise: Architecture & code reasoning
- Claude/GPT-Engineer: Repository automation
- Gemini-Vision: Diagram parsing
- WhisperX: Meeting transcription
- OpenSearch/Pinecone: Vector search for context recall

**AI Incident Response:**
- PII Exposure: <1 hour
- Model Failure: <5 minutes
- Hallucination: <24 hours
- Security Breach: <30 minutes
- Bias Detection: <48 hours

---

#### 9. Documentation Standards

**Architecture Decision Records (ADR):**
**Mandatory** for all architectural decisions:
```markdown
# ADR-XXXX: [Title]
## Status: Proposed | Accepted | Rejected | Deprecated | Superseded
## Context: [Why this decision is needed]
## Decision: [What was decided]
## Consequences: [Positive + Negative impacts]
## Alternatives Considered: [What else was evaluated]
## References: [Links to docs, discussions]
```

**ADR Review Process:**
1. Draft → 2. Review → 3. Discussion → 4. Decision → 5. Finalize

**Location**: `/docs/adr/XXXX-title.md`

**Runbooks:**
**Mandatory** for all production alerts:
- Alert description
- Debugging steps
- Resolution procedures
- Escalation contacts

---

#### 10. CI/CD & DevOps

**GitHub Actions Pipeline:**
```yaml
# Every commit:
- Lint (ESLint + Prettier)
- Type check (TypeScript strict)
- Unit tests (Jest/Vitest, 80%+ coverage)
- SAST (Snyk)

# Every PR:
- Integration tests (Supertest)
- DAST (OWASP ZAP)
- Security scanning (dependency check)
- Build verification

# Pre-deploy:
- E2E tests (Playwright)
- Performance tests (k6)
- Database migrations (drizzle-kit push)
- Zero-downtime deployment
```

**Deployment Strategy:**
- **Trunk-based development**: Feature flags for incomplete features
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`
- **GPG-signed commits**: Mandatory for production
- **Zero-downtime migrations**: Blue-green deployments
- **Rollback capability**: Automated within 5 minutes

---

#### 11. Vorklee2-Specific Patterns (Critical Implementation Details)

**Core Identity Integration:**
```typescript
// All apps verify JWT from Core Platform
import { getUserAuth } from '@core-auth';

const { userId, orgId, role } = await getUserAuth(request);
```

**Organization Isolation (RLS):**
```sql
-- Set RLS context variables for every request
SET app.current_user_id = 'uuid';
SET app.current_org_id = 'uuid';

-- All queries automatically scoped by RLS policies
```

**Real-Time Collaboration:**
```typescript
// WebSocket via Redis pub/sub
- Operational transformation for conflict resolution
- Last-Write-Wins with timestamps
- Active sessions tracked in DB (active_sessions table)
```

**Event Emission:**
```typescript
// Publish to Kafka for cross-app communication
await eventBus.publish('notes.created', {
  note_id: 'uuid',
  user_id: 'uuid',
  org_id: 'uuid',
});
```

---

#### 12. FinOps & Sustainability

**Cost Optimization:**
- Resource tagging: By org_id and app_id
- Budget alerts: Proactive notifications
- Autoscaling policies: 1-8 vCPUs per workload
- Spot instances: For batch jobs
- Capacity planning: 50% headroom buffer

**Sustainability:**
- Energy-efficient algorithms
- Serverless compute (pay-per-use)
- CDN edge caching (reduce data transfer)
- Green hosting (renewable energy data centers)

---

### Development Checklist

When developing any feature, ensure:

1. ✅ **Follow exact tech stack** (Next.js 15, Drizzle ORM, NeonDB, Redis, Material UI v7)
2. ✅ **Apply multi-tenant patterns** (organization isolation, RLS)
3. ✅ **Use shared packages** (@core-auth for authentication, @core-utils for logging/validation)
4. ✅ **Implement security best practices** (JWT + MFA, field-level encryption, audit logging)
5. ✅ **Meet performance targets** (P95 <250ms, >80% cache hit rate, Lighthouse >90)
6. ✅ **Ensure compliance** (GDPR DSAR automation, SOC2 evidence collection, HIPAA BAA tracking)
7. ✅ **Build mobile-optimized** (PWA, offline-first, 48px touch targets)
8. ✅ **Add observability** (structured logs with trace_id, Prometheus metrics, OpenTelemetry traces)
9. ✅ **Plan for resilience** (circuit breakers, retries, DR procedures)
10. ✅ **Document decisions** (ADRs for architecture changes, runbooks for operations)

---

### Quick Reference Commands

```bash
# Start development
npm run dev

# Run tests
npm run test              # All tests
npm run test:coverage     # With coverage
npm run test:e2e          # E2E tests

# Database migrations
npm run db:push           # Push schema changes
npm run db:studio         # Open Drizzle Studio

# Build and deploy
npm run build             # Production build
npm run lint              # Lint all code
npm run type-check        # TypeScript validation

# Performance testing
npm run test:perf         # k6 load tests

# Security scanning
npm run security:scan     # Snyk + OWASP ZAP
```

---

### AI Assistant Instructions

**When I (the user) ask you to develop a feature:**

1. **Review this section first** - Ensure you understand all requirements
2. **Ask clarifying questions** - If anything is ambiguous
3. **Create a plan** - Break down into steps with TodoWrite tool
4. **Follow standards** - Every item in the checklist above
5. **Test thoroughly** - Unit, integration, E2E tests
6. **Document decisions** - Create ADR if architectural
7. **Review before completion** - Ensure all requirements met

**This is the single source of truth for all Vorklee2 development.**

---

**End of File — 02_Platform_Overview_and_Core_Principles_v5.md**
