---
version: "4.0"
maintainer: "Vorklee2 DevOps / API Engineering Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 📡 08_Common_API_Documentation_Standards.md  
## Vorklee2 API Documentation Standards & Endpoint Examples (v4.0)

---

## 🧭 Purpose

This document defines the **standardized API documentation format**, endpoint naming conventions, request/response patterns, and authentication requirements for all **Core Platform** and **App Module** APIs within the Vorklee2 ecosystem.

It ensures consistency, security, and developer experience across all REST endpoints.

---

## 🧱 1. API Endpoint Naming Conventions

### Core Platform APIs
- Base Path: `/api/core/[resource]`
- Example: `/api/core/auth/login`, `/api/core/billing/subscriptions`

### App Module APIs
- Base Path: `/api/[resource]`
- Example: `/api/notes`, `/api/notes/:id`

### Naming Rules
- Use **kebab-case** for multi-word resources (e.g., `/api/note-tags`, not `/api/noteTags`)
- Use **plural nouns** for collections (e.g., `/api/notes`, not `/api/note`)
- Use **nested resources** for relationships (e.g., `/api/notes/:noteId/tags`)

---

## 🔐 2. Authentication Requirements

All protected endpoints must validate authentication via `@core-auth`.

### Standard Authentication Flow

```ts
// Example: API Route Handler with Auth
import { NextRequest, NextResponse } from "next/server";
import { getUserAuth } from "@core-auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Validate session
    const { userId, orgId, session } = await getUserAuth(req);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Proceed with authenticated logic
    // ...
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Public Endpoints
Endpoints that don't require authentication should be explicitly documented:
```ts
// Public endpoint (no auth required)
export async function GET() {
  // ...
}
```

---

## 📋 3. Standard Request/Response Formats

### Request Format

All POST/PATCH requests should accept JSON:

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Never accept** client-provided `userId` or `organizationId` — derive from session.

### Response Format

#### Success Response (200/201)
```json
{
  "data": {
    "id": "uuid",
    "field1": "value1",
    "field2": "value2",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Success Response (List - 200)
```json
{
  "data": [
    { "id": "uuid1", "field1": "value1" },
    { "id": "uuid2", "field1": "value2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Error Response (4xx/5xx)
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

---

## 📝 4. Endpoint Documentation Template

Each endpoint should be documented using this structure:

### Template
```
## [HTTP Method] /api/[resource]/[path]

### Description
Brief description of the endpoint's purpose.

### Authentication
- ✅ Required (via JWT)
- ❌ Public (no auth)

### Request Headers
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | ✅ | JWT token in cookie or header |
| `Content-Type` | string | ✅ | `application/json` |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field1` | string | ✅ | Description |
| `field2` | number | ❌ | Optional field |

### Response (200 OK)
```json
{
  "data": { ... }
}
```

### Response (400 Bad Request)
```json
{
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR"
  }
}
```

### Rate Limit
- 100 requests per minute per organization
```

---

## 🧩 5. Core Platform API Examples

### Example 1: Authentication - Login

```
## POST /api/core/auth/login

### Description
Authenticates a user and issues a JWT session token.

### Authentication
- ❌ Public (no auth required)

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | User email address |
| `password` | string | ✅ | User password |

### Request Example
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Response (200 OK)
```json
{
  "data": {
    "userId": "uuid",
    "orgId": "uuid",
    "token": "jwt-token-string",
    "expiresIn": 3600
  }
}
```

### Response (401 Unauthorized)
```json
{
  "error": {
    "message": "Invalid email or password",
    "code": "AUTH_FAILED"
  }
}
```
```

### Example 2: Billing - Check Subscription

```
## GET /api/core/billing/subscriptions/:orgId

### Description
Retrieves subscription status for an organization.

### Authentication
- ✅ Required (JWT with org access)

### Request Headers
| Header | Type | Required |
|--------|------|----------|
| `Authorization` | string | ✅ |

### Response (200 OK)
```json
{
  "data": {
    "orgId": "uuid",
    "subscriptions": [
      {
        "appId": "uuid",
        "appCode": "notes",
        "planCode": "pro",
        "status": "active",
        "expiresAt": "2024-12-31T23:59:59Z"
      }
    ]
  }
}
```

### Response (403 Forbidden)
```json
{
  "error": {
    "message": "Access denied to this organization",
    "code": "FORBIDDEN"
  }
}
```
```

---

## 🧠 6. App Module API Examples (Notes App)

### Example 1: Create Note

```
## POST /api/notes

### Description
Creates a new note for the authenticated user's organization.

### Authentication
- ✅ Required (JWT)

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Note title (max 255 chars) |
| `content` | string | ❌ | Note content (markdown) |
| `notebookId` | uuid | ❌ | Optional notebook ID |
| `tags` | array<string> | ❌ | Array of tag names |

### Request Example
```json
{
  "title": "Meeting Notes - Q1 Planning",
  "content": "# Q1 Planning\n\n## Agenda\n- Item 1",
  "notebookId": "uuid",
  "tags": ["meeting", "planning"]
}
```

### Response (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "title": "Meeting Notes - Q1 Planning",
    "content": "# Q1 Planning\n\n## Agenda\n- Item 1",
    "notebookId": "uuid",
    "organizationId": "uuid",
    "createdBy": "uuid",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "isArchived": false,
    "tags": [
      { "id": "uuid", "name": "meeting" },
      { "id": "uuid", "name": "planning" }
    ]
  }
}
```

### Response (400 Bad Request)
```json
{
  "error": {
    "message": "Validation failed: title is required",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "title",
      "reason": "required"
    }
  }
}
```

### Rate Limit
- 100 requests per minute per organization
```

### Example 2: List Notes (with Pagination)

```
## GET /api/notes

### Description
Retrieves a paginated list of notes for the authenticated organization.

### Authentication
- ✅ Required (JWT)

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | ❌ | 1 | Page number |
| `limit` | number | ❌ | 20 | Items per page (max 100) |
| `notebookId` | uuid | ❌ | - | Filter by notebook |
| `tag` | string | ❌ | - | Filter by tag name |
| `search` | string | ❌ | - | Full-text search query |
| `archived` | boolean | ❌ | false | Include archived notes |

### Request Example
```
GET /api/notes?page=1&limit=20&notebookId=uuid&search=meeting
```

### Response (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Meeting Notes",
      "content": "...",
      "notebookId": "uuid",
      "createdAt": "2024-01-01T12:00:00Z",
      "tags": ["meeting"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```
```

### Example 3: Update Note

```
## PATCH /api/notes/:id

### Description
Updates an existing note. Only the note owner or org admin can update.

### Authentication
- ✅ Required (JWT)

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | ✅ | Note ID |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ❌ | Updated title |
| `content` | string | ❌ | Updated content |
| `notebookId` | uuid | ❌ | Move to different notebook |
| `tags` | array<string> | ❌ | Replace tags |

### Request Example
```json
{
  "title": "Updated Meeting Notes",
  "content": "Updated content..."
}
```

### Response (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "title": "Updated Meeting Notes",
    "content": "Updated content...",
    "updatedAt": "2024-01-01T13:00:00Z"
  }
}
```

### Response (404 Not Found)
```json
{
  "error": {
    "message": "Note not found",
    "code": "NOT_FOUND"
  }
}
```

### Response (403 Forbidden)
```json
{
  "error": {
    "message": "You don't have permission to update this note",
    "code": "FORBIDDEN"
  }
}
```
```

### Example 4: Delete Note (Soft Delete)

```
## DELETE /api/notes/:id

### Description
Soft-deletes a note. The note is marked as archived but not permanently removed.

### Authentication
- ✅ Required (JWT)

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | ✅ | Note ID |

### Response (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "message": "Note deleted successfully"
  }
}
```

### Response (404 Not Found)
```json
{
  "error": {
    "message": "Note not found",
    "code": "NOT_FOUND"
  }
}
```
```

---

## ⚠️ 7. Error Handling Standards

### HTTP Status Codes

| Code | Usage | Description |
|------|--------|-------------|
| `200` | Success | GET, PATCH requests |
| `201` | Created | POST requests (resource created) |
| `204` | No Content | DELETE requests (successful, no body) |
| `400` | Bad Request | Validation errors, malformed requests |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Authenticated but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource conflict (e.g., duplicate entry) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side errors |

### Error Response Structure

Always include original error message:

```ts
try {
  // operation
} catch (error) {
  throw new Error(`Operation failed: ${error.message}`);
}
```

### Standard Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTH_FAILED` | Authentication failed |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_ERROR` | Unexpected server error |

---

## 🧾 8. Rate Limiting

All endpoints should implement rate limiting via `@core-utils/rateLimiter`.

### Standard Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 5 minutes |
| CRUD Operations | 100 requests | 1 minute |
| Search/Query | 200 requests | 1 minute |
| File Upload | 50 requests | 1 minute |

### Rate Limit Headers

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704110400
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "message": "Rate limit exceeded. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 60
  }
}
```

---

## 📊 9. Pagination Standards

### Query Parameters
- `page`: Page number (starts at 1)
- `limit`: Items per page (default: 20, max: 100)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔍 10. Filtering and Search

### Query Parameter Patterns

| Pattern | Example | Description |
|--------|---------|-------------|
| Exact match | `?status=active` | Filter by exact value |
| Multiple values | `?tags=meeting&tags=planning` | Array of values |
| Range | `?createdAtFrom=2024-01-01&createdAtTo=2024-12-31` | Date range |
| Search | `?search=keyword` | Full-text search |
| Sorting | `?sort=createdAt&order=desc` | Sort results |

### Example
```
GET /api/notes?page=1&limit=20&notebookId=uuid&tags=meeting&tags=planning&search=Q1&sort=createdAt&order=desc
```

---

## 🧩 11. File Upload Standards

### Endpoint Pattern
```
POST /api/[resource]/[id]/attachments
```

### Request Format
- Content-Type: `multipart/form-data`
- Field name: `file`

### Request Example
```ts
const formData = new FormData();
formData.append('file', fileBlob);

fetch('/api/notes/uuid/attachments', {
  method: 'POST',
  body: formData
});
```

### Response (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "fileName": "document.pdf",
    "fileUrl": "https://cdn.vorklee2.com/files/uuid/document.pdf",
    "fileType": "application/pdf",
    "size": 1024000,
    "uploadedAt": "2024-01-01T12:00:00Z"
  }
}
```

### File Size Limits
- Images: 5 MB
- Documents: 10 MB
- Videos: 50 MB (Enterprise only)

---

## 📝 12. Documentation Best Practices

1. **Include examples** for all endpoints (request + response)
2. **Document all possible error codes** for each endpoint
3. **Specify authentication requirements** clearly
4. **Provide rate limit information** per endpoint
5. **Include query parameter descriptions** with defaults
6. **Show complete request/response examples**, not just schemas
7. **Document breaking changes** in version notes
8. **Include code snippets** for common use cases

---

## ✅ Summary

The **API Documentation Standards (v4.0)** ensure all Core and App APIs follow consistent patterns for:
- Authentication and authorization
- Request/response formatting
- Error handling
- Rate limiting
- Pagination and filtering
- File uploads

All API endpoints must be documented using these standards to maintain consistency and developer experience across the Vorklee2 ecosystem.

---

**End of File — Vorklee2 API Documentation Standards (v4.0)**
