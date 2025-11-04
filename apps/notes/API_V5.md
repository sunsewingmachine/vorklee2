# 📝 Notes App V5 - API Documentation

Complete API reference for the Vorklee2 Notes application V5.

**Base URL**: `http://localhost:3001` (development) | `https://notes.vorklee.com` (production)

---

## 🔐 Authentication

All endpoints require authentication via JWT token (except public shared notes).

```http
Authorization: Bearer <jwt_token>
```

For development with `DEV_SKIP_AUTH=true`, authentication is bypassed.

---

## 📝 Notes API

### List Notes

```http
GET /api/notes
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max: 100) |
| `notebook_id` | uuid | - | Filter by notebook |
| `is_pinned` | boolean | - | Filter pinned notes |
| `includeArchived` | boolean | false | Include archived notes |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Meeting Notes - Q4",
      "contentPreview": "Discussed quarterly goals and...",
      "wordCount": 250,
      "isPinned": false,
      "isArchived": false,
      "notebookId": "abc-123",
      "createdAt": "2025-11-04T10:00:00Z",
      "updatedAt": "2025-11-04T12:30:00Z",
      "version": 3,
      "lastEditedBy": "user-uuid"
    }
  ],
  "metadata": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 142,
      "totalPages": 8
    }
  }
}
```

### Create Note

```http
POST /api/notes
```

**Request Body**:
```json
{
  "title": "Meeting Notes",
  "content": "## Agenda\n\n1. Review Q3\n2. Set Q4 goals",
  "notebookId": "uuid", // optional
  "isPinned": false,
  "isTemplate": false
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes",
    "content": "## Agenda...",
    "contentPreview": "Agenda Review Q3 Set Q4 goals",
    "wordCount": 8,
    "version": 1,
    "createdAt": "2025-11-04T14:00:00Z"
  }
}
```

### Get Single Note

```http
GET /api/notes/:id
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes",
    "content": "Full markdown content here...",
    "wordCount": 250,
    "version": 3,
    "notebook": {
      "id": "abc-123",
      "name": "Work"
    },
    "tags": [
      { "id": "tag-1", "name": "meeting", "color": "#EF4444" }
    ]
  }
}
```

### Update Note

```http
PATCH /api/notes/:id
```

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "isPinned": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 4, // Incremented
    "updatedAt": "2025-11-04T15:00:00Z"
  }
}
```

### Delete Note

```http
DELETE /api/notes/:id
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Note archived successfully"
}
```

---

## 🔗 Sharing API

### Share a Note

```http
POST /api/notes/:id/share
```

**Request Body** (Share with user):
```json
{
  "sharedWithUserId": "user-uuid",
  "permission": "edit" // "view" | "comment" | "edit"
}
```

**Request Body** (Share with organization):
```json
{
  "sharedWithOrgId": "org-uuid",
  "permission": "view"
}
```

**Request Body** (Create public link):
```json
{
  "isPublicLink": true,
  "permission": "view",
  "expiresInDays": 7 // optional, max 365
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "share-uuid",
    "noteId": "note-uuid",
    "permission": "view",
    "isPublicLink": true,
    "publicLinkToken": "AbC123XyZ...",
    "publicUrl": "https://notes.vorklee.com/s/AbC123XyZ",
    "publicLinkExpiresAt": "2025-11-11T00:00:00Z",
    "createdAt": "2025-11-04T14:00:00Z"
  }
}
```

### List Shares

```http
GET /api/notes/:id/share
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "share-uuid",
      "sharedWithUserId": "user-uuid",
      "permission": "edit",
      "createdAt": "2025-11-04T14:00:00Z"
    },
    {
      "id": "share-uuid-2",
      "isPublicLink": true,
      "publicUrl": "https://notes.vorklee.com/s/AbC123",
      "permission": "view",
      "publicLinkExpiresAt": "2025-11-11T00:00:00Z"
    }
  ]
}
```

### Access Public Shared Note

```http
GET /api/shares/public/:token
```

No authentication required.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "note": {
      "title": "Meeting Notes",
      "content": "...",
      "createdAt": "2025-11-04T10:00:00Z"
    },
    "sharedBy": {
      "name": "John Doe"
    },
    "permission": "view",
    "expiresAt": "2025-11-11T00:00:00Z"
  }
}
```

---

## 💬 Comments API

### Add Comment

```http
POST /api/notes/:id/comments
```

**Request Body** (Regular comment):
```json
{
  "content": "Great notes! Can we add budget details?"
}
```

**Request Body** (Reply to comment):
```json
{
  "content": "Good idea, I'll add them.",
  "parentCommentId": "comment-uuid"
}
```

**Request Body** (Inline comment at specific position):
```json
{
  "content": "Please clarify this section",
  "positionStart": 120,
  "positionEnd": 150
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "noteId": "note-uuid",
    "userId": "user-uuid",
    "content": "Great notes!",
    "isResolved": false,
    "createdAt": "2025-11-04T15:00:00Z"
  }
}
```

### List Comments

```http
GET /api/notes/:id/comments
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-1",
      "content": "Great notes!",
      "userId": "user-uuid",
      "createdAt": "2025-11-04T15:00:00Z",
      "isResolved": false,
      "replies": [
        {
          "id": "comment-2",
          "content": "Thanks!",
          "userId": "user-uuid-2",
          "parentCommentId": "comment-1",
          "createdAt": "2025-11-04T15:30:00Z"
        }
      ]
    }
  ]
}
```

### Update Comment

```http
PATCH /api/comments/:id
```

**Request Body**:
```json
{
  "content": "Updated comment text"
}
```

### Resolve Comment

```http
POST /api/comments/:id/resolve
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "isResolved": true,
    "resolvedBy": "user-uuid",
    "resolvedAt": "2025-11-04T16:00:00Z"
  }
}
```

### Delete Comment

```http
DELETE /api/comments/:id
```

---

## 📜 Version History API

### Get Version History

```http
GET /api/notes/:id/versions
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Max versions to return (max: 100) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "version-uuid",
      "noteId": "note-uuid",
      "versionNumber": 3,
      "title": "Meeting Notes - Q4",
      "content": "...",
      "changedBy": "user-uuid",
      "changeSummary": "Added action items",
      "createdAt": "2025-11-04T14:00:00Z"
    },
    {
      "versionNumber": 2,
      "title": "Meeting Notes",
      "changeSummary": "Updated agenda",
      "createdAt": "2025-11-04T12:00:00Z"
    }
  ]
}
```

### Restore Version

```http
POST /api/notes/:id/restore
```

**Request Body**:
```json
{
  "versionNumber": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "note-uuid",
    "version": 4, // New version created
    "title": "Meeting Notes", // Restored content
    "content": "...",
    "restoredFrom": 2,
    "updatedAt": "2025-11-04T16:00:00Z"
  },
  "message": "Note restored to version 2"
}
```

---

## 🔍 Search API

### Full-Text Search

```http
GET /api/search
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `notebook_ids` | string | No | Comma-separated notebook IDs |
| `tag_ids` | string | No | Comma-separated tag IDs |
| `date_from` | ISO date | No | Filter from date |
| `date_to` | ISO date | No | Filter to date |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20) |

**Examples**:
```http
# Simple search
GET /api/search?q=meeting

# Search with filters
GET /api/search?q=planning&notebook_ids=uuid1,uuid2&date_from=2025-11-01

# Search in specific tags
GET /api/search?q=budget&tag_ids=tag-uuid1,tag-uuid2
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "note-uuid",
      "title": "Meeting Notes - Q4",
      "contentPreview": "Discussed quarterly goals and budget planning...",
      "rank": 0.873, // Relevance score
      "wordCount": 250,
      "notebook": {
        "id": "nb-uuid",
        "name": "Work"
      },
      "tags": [
        { "id": "tag-1", "name": "meeting", "color": "#EF4444" }
      ],
      "updatedAt": "2025-11-04T12:00:00Z"
    }
  ],
  "metadata": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

### Search Suggestions (Autocomplete)

```http
GET /api/search/suggestions
```

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| `q` | string | Yes |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "recentSearches": [
      "meeting notes",
      "Q4 planning"
    ],
    "suggestedNotes": [
      {
        "id": "note-uuid",
        "title": "Meeting Notes - Q4"
      }
    ],
    "suggestedTags": [
      "meeting", "planning", "budget"
    ]
  }
}
```

---

## 📚 Notebooks API

### List Notebooks

```http
GET /api/notebooks
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "nb-uuid",
      "name": "Work",
      "description": "Work-related notes",
      "color": "#3B82F6",
      "icon": "briefcase",
      "isDefault": true,
      "noteCount": 45,
      "updatedAt": "2025-11-04T10:00:00Z"
    }
  ]
}
```

### Create Notebook

```http
POST /api/notebooks
```

**Request Body**:
```json
{
  "name": "Personal Projects",
  "description": "Side projects and ideas",
  "color": "#10B981",
  "icon": "lightbulb",
  "isDefault": false
}
```

---

## 🏷️ Tags API

### List Tags

```http
GET /api/tags
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "name": "meeting",
      "color": "#EF4444",
      "usageCount": 45,
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

### Create Tag

```http
POST /api/tags
```

**Request Body**:
```json
{
  "name": "urgent",
  "color": "#DC2626"
}
```

### Add Tags to Note

```http
POST /api/notes/:id/tags
```

**Request Body**:
```json
{
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

---

## 📎 Attachments API (Coming Soon)

### Upload Attachment

```http
POST /api/notes/:id/attachments
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: File to upload (max 10MB)

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "attachment-uuid",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "fileType": "application/pdf",
    "fileUrl": "https://cdn.vorklee.com/...",
    "virusScanStatus": "pending",
    "uploadedAt": "2025-11-04T15:00:00Z"
  }
}
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Note not found",
    "details": {}
  },
  "metadata": {
    "timestamp": "2025-11-04T15:00:00Z",
    "path": "/api/notes/invalid-uuid"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🔄 Rate Limiting

**Default Limits**:
- 100 requests per minute per user/org
- 1000 requests per hour

**Headers** (included in all responses):
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699113600000
```

When exceeded:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## 📊 Pagination

All list endpoints support pagination:

**Request**:
```http
GET /api/notes?page=2&limit=50
```

**Response**:
```json
{
  "data": [...],
  "metadata": {
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 142,
      "totalPages": 3
    },
    "links": {
      "first": "/api/notes?page=1&limit=50",
      "prev": "/api/notes?page=1&limit=50",
      "next": "/api/notes?page=3&limit=50",
      "last": "/api/notes?page=3&limit=50"
    }
  }
}
```

---

## 🔐 Permissions

### Permission Levels

| Level | View | Comment | Edit | Share | Delete |
|-------|------|---------|------|-------|--------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Comment** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📞 Support

- **Postman Collection**: [Download](./postman_collection.json)
- **OpenAPI Spec**: [Download](./openapi.yaml)
- **Issues**: [GitHub](https://github.com/your-org/vorklee2/issues)

---

**API Version**: 5.0
**Last Updated**: 2025-11-04
**Base URL**: `https://notes.vorklee.com`
