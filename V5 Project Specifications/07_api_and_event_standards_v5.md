---
version: "5.3"
maintainer: "Vorklee2 API & Integration Team"
last_updated: "2025-01-15 12:00:00 UTC"
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

## 🧮 7. REST vs GraphQL Architecture Decision

### When to Use REST vs GraphQL

| Use Case | Recommendation | Rationale |
|----------|----------------|-----------|
| **Public APIs** | REST | Better caching, simpler to version, universal client support |
| **Internal APIs** | REST | Simpler deployment, better for CRUD operations |
| **Mobile Apps** | REST with field selection | Better caching, simpler implementation, offline support |
| **Complex Data Fetching** | GraphQL (if >3 joins) | Reduce over-fetching, single request for related data |
| **Real-time Subscriptions** | GraphQL Subscriptions | Built-in subscription support |
| **Third-party Integrations** | REST | Standard format, easier for partners to integrate |

**Current Vorklee2 Strategy:**
- **Primary**: REST APIs for all core functionality
- **Future Consideration**: GraphQL for mobile apps if over-fetching becomes performance bottleneck
- **Decision Criteria**: Adopt GraphQL if:
  - Mobile app requires >5 API calls to render single screen
  - Frontend teams request GraphQL for developer experience
  - Analytics queries need complex nested data structures

### GraphQL Implementation Guidelines (If Adopted)

If GraphQL is adopted in future:

```graphql
# Example: Notes App GraphQL Schema
type Query {
  notes(
    orgId: ID!
    filters: NoteFilters
    pagination: PaginationInput
  ): NoteConnection!
  note(id: ID!, orgId: ID!): Note
}

type Note {
  id: ID!
  title: String!
  content: String!
  tags: [Tag!]!
  attachments: [Attachment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type NoteConnection {
  edges: [NoteEdge!]!
  pageInfo: PageInfo!
}
```

**GraphQL Best Practices:**
- Use DataLoader for N+1 query prevention
- Implement field-level permissions (authorization)
- Add query complexity limits (max depth: 10, max cost: 1000)
- Rate limit by query complexity, not just request count
- Cache GraphQL responses at resolver level

---

## 🧮 8. OpenAPI-First Development Workflow

### OpenAPI-First Principle

**All APIs must be designed using OpenAPI 3.1 specification BEFORE implementation.**

### Workflow

1. **Design Phase** (`/docs/api/{service}/v{version}.yaml`)
   - Define endpoints, request/response schemas
   - Add examples for all operations
   - Document error responses
   - Review with stakeholders

2. **Code Generation Phase**
   ```bash
   # Generate TypeScript types from OpenAPI spec
   openapi-generator-cli generate \
     -i docs/api/notes/v1.yaml \
     -g typescript-axios \
     -o packages/notes-api-client
   
   # Generate server stubs (Next.js API routes)
   openapi-generator-cli generate \
     -i docs/api/notes/v1.yaml \
     -g typescript-nextjs \
     -o apps/notes/app/api/v1
   ```

3. **Implementation Phase**
   - Implement business logic in generated stubs
   - Validate against OpenAPI schema automatically
   - Ensure runtime behavior matches spec

4. **Validation Phase**
   - CI/CD validates OpenAPI spec (syntax, completeness)
   - Contract testing ensures implementation matches spec
   - Documentation auto-generated from spec

### OpenAPI Specification Requirements

**Minimum Required Fields:**
- `openapi: 3.1.0`
- `info.title`, `info.version`, `info.description`
- `servers` array with production/staging URLs
- All `paths` with `summary`, `description`, `tags`
- Request/response schemas with examples
- Error response schemas (400, 401, 403, 404, 500)
- Security schemes (JWT bearer, HMAC)

**Example OpenAPI Path:**
```yaml
paths:
  /notes:
    get:
      summary: List notes
      description: Retrieve paginated list of notes for organization
      tags: [notes]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/OrgId'
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteListResponse'
              examples:
                success:
                  value:
                    success: true
                    data:
                      - id: "123e4567-e89b-12d3-a456-426614174000"
                        title: "Example Note"
                        content: "Content here"
                        created_at: "2025-01-15T10:00:00Z"
                    meta:
                      request_id: "req_abc123"
                      timestamp: "2025-01-15T10:00:00Z"
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimitExceeded'
```

### API Contract Testing

**Tool**: Pact or similar contract testing framework

```typescript
// Example: Contract test for Notes API
import { Pact } from '@pact-foundation/pact';

describe('Notes API Contract', () => {
  const provider = new Pact({
    consumer: 'notes-mobile-app',
    provider: 'notes-api',
  });

  it('returns list of notes', async () => {
    await provider.addInteraction({
      state: 'user has 2 notes',
      uponReceiving: 'a request for notes',
      withRequest: {
        method: 'GET',
        path: '/notes/v1/notes',
        headers: { Authorization: 'Bearer token' },
      },
      willRespondWith: {
        status: 200,
        body: {
          success: true,
          data: [
            { id: 'uuid', title: 'Note 1' },
            { id: 'uuid', title: 'Note 2' },
          ],
        },
      },
    });

    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/notes/v1/notes`);
      expect(response.status).toBe(200);
    });
  });
});
```

**Contract Testing Workflow:**
- Consumer (mobile app) defines expected contract
- Provider (API) validates against contract in CI/CD
- Breaking changes detected before deployment
- Contracts stored in Pact Broker for versioning

---

## 📱 9. Mobile API Optimization Standards

### Mobile-Specific Considerations

Mobile applications have unique requirements that differ from web clients:

| Requirement | Solution | Implementation |
|-------------|----------|----------------|
| **Reduced Payload Size** | Field selection API | `?fields=id,title,created_at` |
| **Battery Efficiency** | Efficient pagination | Cursor-based with prefetching |
| **Offline Support** | Optimistic updates | Return updated entity immediately |
| **Network Efficiency** | Compression | gzip/brotli content negotiation |
| **Rate Limiting** | Separate mobile tiers | Higher limits for mobile apps |
| **Error Handling** | Retryable flags | `retryable: true` in error response |

### Field Selection API (REST)

Allow clients to specify which fields to return (GraphQL-like for REST):

```http
GET /notes/v1/notes?fields=id,title,created_at,updated_at HTTP/1.1
Authorization: Bearer <JWT>
```

**Implementation:**
```typescript
// Server-side field selection
export async function GET(request: NextRequest) {
  const fields = request.nextUrl.searchParams.get('fields')?.split(',') || [];
  
  const notes = await getNotes();
  
  // Return only requested fields
  const filteredNotes = notes.map(note => {
    const filtered: Record<string, any> = {};
    fields.forEach(field => {
      if (note.hasOwnProperty(field)) {
        filtered[field] = note[field];
      }
    });
    return filtered;
  });
  
  return successResponse(filteredNotes, request);
}
```

### Mobile-Optimized Pagination

**Cursor-Based Pagination (Recommended for Mobile):**

```http
GET /notes/v1/notes?cursor=abc123&limit=20 HTTP/1.1
Authorization: Bearer <JWT>
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "cursor": "xyz789",
    "limit": 20,
    "has_more": true
  }
}
```

**Benefits:**
- Stable pagination (no duplicates on inserts)
- Efficient for large datasets
- Better mobile UX (infinite scroll)

### Response Compression

**Content Negotiation:**
```http
GET /notes/v1/notes HTTP/1.1
Authorization: Bearer <JWT>
Accept-Encoding: gzip, br
```

**Server Configuration (Next.js):**
```typescript
// next.config.ts
export default {
  compress: true,
  poweredByHeader: false,
};
```

**Compression Strategy:**
- **Text responses (JSON)**: gzip (good compression, fast)
- **Large payloads (>10KB)**: brotli (better compression)
- **Binary responses**: No compression (already compressed)

### Mobile Rate Limiting

| Client Type | Limits | Burst | Rationale |
|-------------|--------|-------|-----------|
| **Mobile App (iOS/Android)** | 200 req/min | 300 req | Higher due to prefetching |
| **Mobile Web (PWA)** | 100 req/min | 150 req | Standard authenticated |
| **Web App** | 100 req/min | 150 req | Standard |

**Mobile Identification:**
- User-Agent contains `Mobile` or `iOS`/`Android`
- Custom header: `X-Client-Type: mobile`
- Separate rate limit buckets: `rate:mobile:{user_id}`

### Mobile Offline Support

**Optimistic Updates:**
```typescript
// Client creates note optimistically
const optimisticNote = {
  id: 'temp-id',
  title: 'New Note',
  content: '...',
  created_at: new Date().toISOString(),
};

// UI updates immediately
setNotes([...notes, optimisticNote]);

// Sync to server when online
try {
  const realNote = await api.createNote(optimisticNote);
  // Replace temp with real
  setNotes(notes.map(n => n.id === 'temp-id' ? realNote : n));
} catch (error) {
  // Rollback on error
  setNotes(notes.filter(n => n.id !== 'temp-id'));
}
```

**Offline Queue Pattern:**
- Queue mutations when offline
- Sync when connection restored
- Handle conflicts on sync (last-write-wins or merge strategy)

### Mobile Authentication

**Token Refresh Strategy:**
```typescript
// Automatic token refresh before expiry
if (tokenExpiresIn < 5 * 60 * 1000) { // 5 minutes
  const newToken = await refreshToken(refreshToken);
  // Update stored token
  await secureStore.setItem('access_token', newToken);
}
```

**Biometric Integration:**
- Use device biometrics (Face ID, Touch ID, fingerprint)
- Store refresh token in secure keychain/keystore
- Require biometric for sensitive operations

---

## 🧮 10. API Documentation & SDKs

All endpoints defined via **OpenAPI v3.1** specs stored under `/docs/api/{service}/v{version}.yaml`.

### OpenAPI-First Workflow (Mandatory)

1. **Design**: Write OpenAPI spec before implementation
2. **Generate**: Generate types and stubs from spec
3. **Implement**: Fill in generated stubs with business logic
4. **Validate**: Contract tests ensure implementation matches spec
5. **Document**: Auto-generate docs from spec

### Tools
- **Swagger UI** → Interactive API browser (`/docs/api/swagger-ui`)  
- **Redoc** → Static documentation hosting (`/docs/api/redoc`)  
- **Postman Collections** → Auto-generated from OpenAPI (`/docs/api/postman`)  
- **SDK Generation** → `openapi-generator-cli` → TypeScript, Python, Swift, Kotlin SDKs

**SDK Generation Example:**
```bash
# TypeScript/JavaScript SDK
openapi-generator-cli generate \
  -i docs/api/notes/v1.yaml \
  -g typescript-axios \
  -o packages/notes-api-client \
  --additional-properties=npmName=@vorklee/notes-api-client,npmVersion=1.0.0

# Swift SDK (iOS)
openapi-generator-cli generate \
  -i docs/api/notes/v1.yaml \
  -g swift5 \
  -o packages/notes-api-swift

# Kotlin SDK (Android)
openapi-generator-cli generate \
  -i docs/api/notes/v1.yaml \
  -g kotlin \
  -o packages/notes-api-kotlin
```

### SDK Requirements

All SDKs must:
- Auto-generate from OpenAPI spec
- Include TypeScript types / Swift types / Kotlin types
- Handle authentication (JWT token management)
- Implement retry logic with exponential backoff
- Support field selection (if implemented)
- Include request/response interceptors for logging
- Versioned: `@vorklee/notes-api-client@1.0.0`

### API Gateway vs Application Responsibilities

| Responsibility | Layer | Example |
|----------------|-------|---------|
| **Rate Limiting** | Gateway + Application | Gateway: IP-based, App: User-based |
| **Authentication** | Gateway (JWT validation) | Verify signature, check expiry |
| **Authorization** | Application | Check user permissions |
| **Request Validation** | Both | Gateway: size, format; App: business rules |
| **Response Transformation** | Application | Business logic only |
| **Caching** | Gateway (CDN) | Static responses, GET requests |
| **SSL/TLS** | Gateway | Certificate management |
| **API Versioning** | Gateway | Route `/v1/`, `/v2/` |
| **Monitoring** | Both | Gateway: latency, App: business metrics |

**Gateway Configuration (Cloudflare Workers / API Gateway):**
```typescript
// Gateway: JWT validation, rate limiting
addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Validate JWT
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!validateJWT(token)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Rate limit check
  if (await isRateLimited(token)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // Forward to application
  return fetch(`https://app.vorklee.com${request.url}`, request);
});
```

---

## 🔒 13. API Security & Compliance

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

## 🧩 11. API Versioning & Deprecation Policy

| Type | Rule |
|------|------|
| **Version Format** | `/v{major}` (e.g., `/v1`, `/v2`) |
| **Breaking Changes** | Require new version path |
| **Deprecation Notice** | 90 days prior via API header |
| **Header Example** | `Deprecation: version=1, sunset=2025-12-31` |
| **Deprecation Timeline** | 90 days notice → 30 days overlap → Sunset |

### Versioning Strategy

**Version Numbering:**
- **Major Version** (`v1`, `v2`): Breaking changes only
- **Minor Version**: Backward-compatible additions (no URL change)
- **Patch Version**: Bug fixes (no URL change)

**Breaking Changes Requiring New Version:**
- Removing fields from response
- Changing field types
- Removing endpoints
- Changing authentication method
- Changing required parameters
- Changing error response format

**Non-Breaking Changes (Same Version):**
- Adding new endpoints
- Adding optional fields to response
- Adding new query parameters
- Adding new optional request fields
- Improving error messages (same format)

### Deprecation Timeline Example

```
Timeline for v1 → v2 Migration:

Day 0:   v2 released, v1 still active
Day 1:   v1 responses include: Deprecation: version=1, sunset=2025-04-30
Day 60:  Warning emails sent to all API users using v1
Day 75:  Final warning emails + status page announcement
Day 90:  v1 endpoints return 410 Gone (or redirect to v2)
```

**Deprecation Headers:**
```http
HTTP/1.1 200 OK
Deprecation: version=1
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: <https://api.vorklee.com/notes/v2/notes>; rel="successor-version"
```

### Version Compatibility Matrix

| Client Version | Server v1 | Server v2 | Server v3 |
|---------------|-----------|-----------|-----------|
| **Client v1** | ✅ Works | ✅ Works (backward compat) | ❌ Breaks |
| **Client v2** | ✅ Works | ✅ Works | ✅ Works (forward compat) |
| **Client v3** | ❌ Breaks | ✅ Works | ✅ Works |

**Compatibility Guarantee:**
- New server versions maintain backward compatibility for at least 2 major versions
- Clients should support current version + 1 previous version

All deprecated endpoints are logged and monitored in the `analytics` project.

---

## 📋 12. Comprehensive Request/Response Examples

### Example 1: List Notes (GET)

**Request:**
```http
GET /notes/v1/notes?org_id=123e4567-e89b-12d3-a456-426614174000&page=1&limit=20&sort=created_at:desc HTTP/1.1
Host: api.vorklee.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
X-Request-ID: req_abc123
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Meeting Notes",
      "content": "# Q4 Planning\n- Discussed goals\n- Assigned tasks",
      "is_archived": false,
      "is_pinned": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T11:30:00Z",
      "tags": [
        { "id": "tag-1", "name": "meeting", "color": "#3B82F6" }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "links": {
    "self": "/notes/v1/notes?page=1&limit=20",
    "first": "/notes/v1/notes?page=1&limit=20",
    "last": "/notes/v1/notes?page=3&limit=20",
    "next": "/notes/v1/notes?page=2&limit=20",
    "prev": null
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-01-15T12:00:00Z"
  }
}
```

### Example 2: Create Note (POST)

**Request:**
```http
POST /notes/v1/notes HTTP/1.1
Host: api.vorklee.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
X-Request-ID: req_def456

{
  "title": "New Note",
  "content": "This is the note content",
  "notebook_id": "notebook-123",
  "tags": ["tag-1", "tag-2"],
  "is_pinned": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "title": "New Note",
    "content": "This is the note content",
    "notebook_id": "notebook-123",
    "is_archived": false,
    "is_pinned": false,
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-01-15T12:00:00Z",
    "tags": [
      { "id": "tag-1", "name": "important", "color": "#EF4444" },
      { "id": "tag-2", "name": "todo", "color": "#10B981" }
    ]
  },
  "meta": {
    "request_id": "req_def456",
    "timestamp": "2025-01-15T12:00:00Z"
  }
}
```

### Example 3: Validation Error (400 Bad Request)

**Request:**
```http
POST /notes/v1/notes HTTP/1.1
Host: api.vorklee.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "",
  "content": "Content without title"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "title": ["Title is required and must be at least 1 character"]
      }
    },
    "retryable": false
  },
  "meta": {
    "request_id": "req_ghi789",
    "timestamp": "2025-01-15T12:00:00Z",
    "status": 400
  }
}
```

### Example 4: Rate Limit Exceeded (429)

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded",
    "retryable": true,
    "retry_after": 45
  },
  "meta": {
    "request_id": "req_jkl012",
    "timestamp": "2025-01-15T12:00:00Z",
    "status": 429
  }
}
```

**Headers:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 45
```

---

## ✅ Summary

The **API and Event Standards** define how services in Vorklee2 communicate securely and consistently.

**Key Enhancements in v5.3:**
- **REST vs GraphQL Decision Framework**: Clear guidance on when to use each
- **OpenAPI-First Workflow**: Mandatory design-first approach with code generation
- **Mobile API Optimization**: Field selection, cursor pagination, compression, offline support
- **API Contract Testing**: Pact-based contract testing for breaking change prevention
- **API Gateway Responsibilities**: Clear separation of concerns between gateway and application
- **Comprehensive Examples**: Complete request/response examples for all common operations
- **Versioning & Deprecation**: Detailed timeline and compatibility matrix
- **SDK Generation**: Multi-language SDK support (TypeScript, Swift, Kotlin)

**Original Enhancements:**
- **Tiered Rate Limiting**: Anonymous 10/min, Authenticated 100/min, Enterprise 1000/min with burst
- **Request Signing**: HMAC signatures for sensitive operations with nonce-based replay prevention
- **Idempotency**: Idempotency-Key header support for POST/PUT/PATCH operations
- **Event Versioning**: CloudEvents format with schema registry and version-aware consumers
- **DLQ Strategy**: 4-attempt retry with exponential backoff (30s, 5min, 30min) → DLQ
- **Circuit Breakers**: Prevent cascade failures with configurable thresholds
- **Event Replay**: Disaster recovery capability with time-based filtering

By enforcing REST and event-based best practices with enterprise security controls, mobile optimization, and future-proof architecture decisions, the system achieves high scalability, transparency, integration readiness, and excellent mobile developer experience.

---

**Related Documents:**
- See `12_mobile_and_web_platform_standards_v5.md` for mobile API implementation details
- See `06_engineering_and_security_guidelines_v5.md` for security testing requirements

**End of File — 07_API_and_Event_Standards_v5.md**
