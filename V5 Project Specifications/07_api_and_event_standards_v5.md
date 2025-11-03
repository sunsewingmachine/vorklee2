---
version: "5.2"
maintainer: "Vorklee2 API & Integration Team"
last_updated: "2025-11-03 03:39:36 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# 📡 07_API_and_Event_Standards_v5.md  
## REST API, Webhook, and Event-Driven Architecture Guidelines for Vorklee2

---

## 🧭 Purpose
This document defines the **API and event communication standards** across the **Vorklee2 multi-project ecosystem (v5.2)**.  
It ensures consistent data exchange between the Core Identity Service, app modules (Notes, Attendance, HR), and third-party integrations.

---

## 🧱 1. API Architecture Overview

| Layer | Description |
|--------|-------------|
| **Core API** | Identity, auth, orgs, permissions |
| **Module APIs** | Notes, Attendance, HR, Analytics |
| **Event Bus** | Kafka / RabbitMQ for async communication |
| **Gateway** | Edge layer (API Gateway / Cloudflare Workers) |

All APIs are stateless and secured via **JWT** from the Core service.

---

## ⚙️ 2. REST API Design Standards

| Category | Rule |
|-----------|------|
| **Base URL** | `https://api.vorklee.com/{service}/v1` |
| **Naming** | Plural nouns, kebab-case (`/users`, `/notes`) |
| **HTTP Methods** | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| **Versioning** | Included in path (`/v1/`) |
| **Pagination** | `?page=1&limit=20` |
| **Sorting** | `?sort=created_at:desc` |
| **Filtering** | `?status=active&org_id=...` |
| **Rate Limit** | Tiered: Anonymous 10/min, Auth 100/min, Enterprise 1000/min |
| **Timeout** | 30 seconds |
| **Idempotency** | Idempotency-Key header for POST/PUT/PATCH |

Example request:
```http
GET /notes/v1/notes?org_id=123e... HTTP/1.1
Authorization: Bearer <JWT>
Accept: application/json
```

---

## 🧩 3. Standard Response Format

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example Note"
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2025-11-03T12:00:00Z"
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Invalid or expired token."
  }
}
```

| HTTP Code | Description |
|------------|--------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## 🧠 4. Authentication & Authorization

- All APIs require **JWT** issued by Core (`Authorization: Bearer <token>`).
- Scopes and roles validated by each service via shared SDK `@vorklee/auth-client`.
- Tokens expire every 24 hours; refresh tokens valid for 7 days.
- Internal service communication signed with **HMAC headers**.

### JWT Authentication
```http
GET /notes/v1/notes HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### HMAC Request Signing (Inter-Service)

For sensitive operations (DELETE, bulk updates), requests are signed:

```http
POST /notes/v1/notes/bulk-delete HTTP/1.1
Authorization: Bearer <JWT>
X-Service-Name: admin-console
X-Service-Signature: sha256=abc123def456...
X-Request-Timestamp: 1704067200
X-Request-Nonce: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{"note_ids": ["id1", "id2", "id3"]}
```

**Signature Calculation:**
```typescript
const payload = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}`;
const signature = crypto
  .createHmac('sha256', SERVICE_SECRET)
  .update(payload)
  .digest('hex');
```

**Validation:**
- Verify signature matches
- Check timestamp within 5 minutes (prevent replay)
- Verify nonce not used before (store in Redis for 10 minutes)
- Validate service_name is authorized for this operation

### Idempotency Keys

For POST, PUT, PATCH operations, clients can provide an idempotency key:

```http
POST /notes/v1/notes HTTP/1.1
Authorization: Bearer <JWT>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{"title": "New Note", "content": "..."}
```

**Server Behavior:**
- Store key + response hash in Redis (24-hour TTL)
- If same key submitted again within 24h → return cached response (409 Conflict with original response)
- Prevents duplicate operations (e.g., double note creation)

---

## 🔐 5. Enhanced Rate Limiting

### Tiered Rate Limits

| Tier | Authentication | Limits | Burst Allowance | Identification |
|------|----------------|--------|-----------------|----------------|
| **Anonymous** | None | 10 req/min | 20 req (2x) | IP address |
| **Authenticated** | JWT | 100 req/min | 150 req (1.5x) | user_id |
| **Pro** | JWT + Pro plan | 500 req/min | 750 req | user_id |
| **Enterprise** | JWT + Enterprise plan | 1000 req/min | 2000 req | user_id + org_id |
| **Internal Services** | HMAC signed | No limit | N/A | service_name |

### Rate Limit Headers

All API responses include rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1704067200
X-RateLimit-Retry-After: 45
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded",
    "retry_after": 45
  }
}
```

HTTP Status: `429 Too Many Requests`

### DDoS Protection

- **API Gateway Level**: Cloudflare WAF with automatic DDoS mitigation
- **Application Level**: Redis-based sliding window rate limiter
- **Geo-Blocking**: Optional per-org blocking of specific countries
- **IP Reputation**: Automatic blocking of known malicious IPs
- **Challenge**: CAPTCHA for suspected bot traffic

### Circuit Breaker Pattern

Services implement circuit breakers to prevent cascade failures:

```typescript
// Circuit opens after 5 failures in 30 seconds
const circuitBreaker = new CircuitBreaker(externalService, {
  threshold: 5,
  timeout: 30000,
  resetTimeout: 60000
});
```

**States:**
- **Closed**: Normal operation, requests flow through
- **Open**: Service failing, requests fail fast without calling downstream
- **Half-Open**: Testing if service recovered, limited requests allowed

---

## 🧩 6. Webhook Standards

Webhooks are used for **real-time updates** between services and external clients.

| Field | Description |
|--------|-------------|
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Auth** | HMAC signature using Core secret |
| **Retry Policy** | Exponential backoff: 30s, 5min, 30min (3 attempts) |
| **Timeout** | 10s |
| **Dead Letter Queue** | After 3 failures → DLQ for manual review |

### Example Payload
```json
{
  "event": "user.created",
  "timestamp": "2025-11-03T13:10:00Z",
  "data": {
    "user_id": "uuid",
    "org_id": "uuid"
  },
  "signature": "hmac-sha256:abcd1234"
}
```

**Verification:**
```bash
echo -n $body | openssl dgst -sha256 -hmac $SECRET
```

---

## 🔔 7. Event-Driven Communication

Vorklee2 uses a **hybrid event-driven model** powered by Kafka / RabbitMQ.
Each service publishes and subscribes to events related to its domain.

| Event | Producer | Consumers |
|--------|-----------|-----------|
| `user.created.v1` | Core | Notes, Attendance, HR |
| `org.updated.v1` | Core | All apps |
| `notes.created.v2` | Notes | Analytics, Core |
| `attendance.logged.v1` | Attendance | Analytics |
| `employee.added.v1` | HR | Analytics, Core |

### Event Structure (CloudEvents Format)

```json
{
  "specversion": "1.0",
  "type": "com.vorklee.notes.created",
  "source": "notes-service",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": "2025-01-15T10:30:45.123Z",
  "datacontenttype": "application/json",
  "dataschema": "https://schemas.vorklee.com/notes/created/v2",
  "subject": "note/abc123",
  "data": {
    "note_id": "abc123",
    "user_id": "uuid",
    "org_id": "uuid",
    "title": "New Note",
    "version": "v2"
  },
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
}
```

### Event Schema Versioning

**Schema Registry**: All events registered in **Confluent Schema Registry** or similar

**Version Strategy:**
- **Major version** in event type: `notes.created.v2`
- **Backward compatible** changes within same major version
- **Breaking changes** require new major version

**Version Handling:**
```typescript
// Producer
const event = {
  type: 'notes.created.v2',
  dataschema: 'https://schemas.vorklee.com/notes/created/v2',
  data: { /* new schema */ }
};

// Consumer
switch (event.type) {
  case 'notes.created.v1':
    return handleV1(event.data);
  case 'notes.created.v2':
    return handleV2(event.data);
  default:
    logger.warn(`Unknown event version: ${event.type}`);
}
```

### Dead Letter Queue (DLQ) Strategy

When event processing fails repeatedly:

1. **Attempt 1**: Process immediately
2. **Attempt 2**: Retry after 30 seconds
3. **Attempt 3**: Retry after 5 minutes
4. **Attempt 4**: Retry after 30 minutes
5. **After 4 failures**: Move to DLQ → alert engineering team

**DLQ Schema:**
```json
{
  "original_event": { /* full event payload */ },
  "error_details": {
    "message": "Database connection timeout",
    "stack_trace": "...",
    "attempts": 4
  },
  "first_failure_at": "2025-01-15T10:30:45Z",
  "last_failure_at": "2025-01-15T11:15:00Z",
  "dlq_timestamp": "2025-01-15T11:15:30Z"
}
```

**DLQ Processing:**
- Manual review via admin console
- Replay capability after fixing issues
- Automatic expiration after 30 days

### Event Ordering Guarantees

- **Kafka Partitioning**: Events keyed by `org_id` for ordering within organization
- **Consumer Groups**: One consumer per group processes each event
- **Idempotent Consumers**: Use event `id` to detect duplicates

### Event Replay

For disaster recovery or debugging:

```bash
# Replay events for specific org from specific timestamp
kafka-replay --topic notes-events \
  --start-time "2025-01-15T10:00:00Z" \
  --filter "org_id=123e4567" \
  --destination notes-replay-topic
```

---

## 🧮 7. API Documentation & SDKs

All endpoints defined via **OpenAPI v3** specs stored under `/docs/api/{service}.yaml`.

### Tools
- **Swagger UI** → Interactive API browser.  
- **Redoc** → Static documentation hosting.  
- **Postman Collections** → Developer testing suite.  
- **SDK Generation** → `openapi-generator-cli` → TypeScript + Python SDKs.

Example:
```bash
openapi-generator-cli generate -i core-api.yaml -g typescript-axios -o ./packages/core-sdk
```

---

## 🔐 8. Security & Compliance

- TLS 1.3 enforced for all requests.  
- CORS restricted to approved domains.  
- Sensitive data fields masked in responses (`email`, `phone`).  
- Logs scrubbed for PII before export to analytics.  
- API tokens rotated every 90 days.  

### Audit Logging
Each API request logged to `core.audit_logs` with:
```json
{
  "service": "notes",
  "user_id": "uuid",
  "method": "POST",
  "path": "/notes/v1/notes",
  "status": 201,
  "duration_ms": 45
}
```

---

## 🧩 9. API Versioning & Deprecation Policy

| Type | Rule |
|------|------|
| **Version Format** | `/v{major}` (e.g., `/v1`) |
| **Breaking Changes** | Require new version path |
| **Deprecation Notice** | 90 days prior via API header |
| **Header Example** | `Deprecation: version=1, sunset=2025-12-31` |

All deprecated endpoints are logged and monitored in the `analytics` project.

---

## ✅ Summary

The **API and Event Standards** define how services in Vorklee2 communicate securely and consistently.

**Key Enhancements:**
- **Tiered Rate Limiting**: Anonymous 10/min, Authenticated 100/min, Enterprise 1000/min with burst
- **Request Signing**: HMAC signatures for sensitive operations with nonce-based replay prevention
- **Idempotency**: Idempotency-Key header support for POST/PUT/PATCH operations
- **Event Versioning**: CloudEvents format with schema registry and version-aware consumers
- **DLQ Strategy**: 4-attempt retry with exponential backoff (30s, 5min, 30min) → DLQ
- **Circuit Breakers**: Prevent cascade failures with configurable thresholds
- **Event Replay**: Disaster recovery capability with time-based filtering

By enforcing REST and event-based best practices with enterprise security controls, the system achieves high scalability, transparency, and integration readiness.

---

**End of File — 07_API_and_Event_Standards_v5.md**
