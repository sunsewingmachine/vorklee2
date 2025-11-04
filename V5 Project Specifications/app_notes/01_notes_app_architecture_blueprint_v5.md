---
version: "5.4"
maintainer: "Vorklee2 Notes Product Team"
last_updated: "2025-11-04 UTC"
tier: "enterprise"
format: "markdown"
parent_specs: ["00_PLATFORM_EXCELLENCE_SUMMARY_v5.md", "03_core_identity_and_auth_architecture_v5.md", "06_engineering_and_security_guidelines_v5.md", "10_mobile_and_web_platform_standards_v5.md"]
---

# 📝 Notes App - Technical Architecture Blueprint
## Database Schema, API Design, and Integration Architecture

---

## 🧭 Purpose

This document defines the **Notes app-specific architecture** — database schema, API endpoints, real-time collaboration, and integration patterns with the Vorklee2 platform.

**Platform-Wide Standards:** See parent specification files for platform-wide standards (security, CI/CD, mobile, compliance). This document covers **only Notes app-specific** implementation details.

---

## 🏗️ 1. Architecture Overview

### Notes App in Platform Context

```
┌─────────────────────────────────────────────────────────┐
│                  Vorklee2 Platform                      │
├─────────────────────────────────────────────────────────┤
│ Core Identity (JWT, Users, Orgs, Permissions)          │
│ Analytics (Usage Metrics, Business Intelligence)        │
│ Platform Standards (Security, Mobile, CI/CD)            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Notes App (Independent Service)            │
├─────────────────────────────────────────────────────────┤
│ • Neon Project: vorklee-notes-prod                      │
│ • Database: Notes, Notebooks, Tags, Attachments         │
│ • Real-Time: WebSocket for collaboration               │
│ • Storage: S3/R2 for file attachments                  │
│ • Cache: Redis for note lists, search results          │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

| Component | Integration Method | Purpose |
|-----------|-------------------|---------|
| **Core Identity** | JWT validation + `/auth/verify` API | Authentication, user/org data |
| **Analytics** | Event emission via Kafka/Webhook | Usage tracking, business metrics |
| **Platform Cache** | Shared Redis instance | User sessions, note lists |
| **Platform Storage** | S3/Cloudflare R2 | File attachments, images |
| **Platform CDN** | Cloudflare | Static assets, attachment delivery |

**References:**
- Authentication: See `03_core_identity_and_auth_architecture_v5.md`
- Security standards: See `06_engineering_and_security_guidelines_v5.md`
- Mobile architecture: See `10_mobile_and_web_platform_standards_v5.md`

---

## 🗄️ 2. Database Schema (`vorklee-notes-prod`)

### Schema: `public`

```sql
-- ============================================================================
-- NOTEBOOKS: Organization of notes into collections
-- ============================================================================
CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color for UI (e.g., #3B82F6)
  icon VARCHAR(50), -- Icon identifier (e.g., 'book', 'folder')
  is_default BOOLEAN DEFAULT false, -- One default notebook per org
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- NOTES: Core note content
-- ============================================================================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE SET NULL,

  -- Content
  title TEXT,
  content TEXT, -- Markdown content
  content_preview TEXT, -- First 200 chars (for list view)
  word_count INTEGER DEFAULT 0,

  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,

  -- Version tracking
  version INTEGER DEFAULT 1,
  last_edited_by UUID NOT NULL,

  -- Search optimization
  search_vector tsvector, -- Full-text search

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_viewed_at TIMESTAMPTZ
);

-- ============================================================================
-- TAGS: Flexible categorization
-- ============================================================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  color VARCHAR(7), -- Hex color (e.g., #EF4444)
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, name)
);

CREATE TABLE public.note_tags (
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (note_id, tag_id)
);

-- ============================================================================
-- ATTACHMENTS: File uploads
-- ============================================================================
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type VARCHAR(100), -- MIME type (e.g., image/png)
  file_size INTEGER NOT NULL, -- Bytes
  file_url TEXT NOT NULL, -- S3/R2 URL

  -- Image-specific metadata
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,

  -- Security
  virus_scan_status VARCHAR(20) DEFAULT 'pending', -- pending, clean, infected
  virus_scan_at TIMESTAMPTZ,

  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SHARING: Note collaboration and permissions
-- ============================================================================
CREATE TABLE public.note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with_user_id UUID, -- Individual user share
  shared_with_org_id UUID, -- Org-wide share

  -- Permissions
  permission VARCHAR(20) NOT NULL, -- view, comment, edit

  -- Link sharing
  is_public_link BOOLEAN DEFAULT false,
  public_link_token VARCHAR(64) UNIQUE, -- Random token for public access
  public_link_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT share_target_check CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_org_id IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_org_id IS NOT NULL) OR
    (is_public_link = true)
  )
);

-- ============================================================================
-- COMMENTS: Inline collaboration
-- ============================================================================
CREATE TABLE public.note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Comment content
  content TEXT NOT NULL,

  -- Threading
  parent_comment_id UUID REFERENCES public.note_comments(id) ON DELETE CASCADE,

  -- Position in document (for inline comments)
  position_start INTEGER, -- Character offset
  position_end INTEGER,

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- VERSION HISTORY: Track changes
-- ============================================================================
CREATE TABLE public.note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot
  title TEXT,
  content TEXT,

  -- Change metadata
  changed_by UUID NOT NULL,
  change_summary TEXT, -- Optional description

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(note_id, version_number)
);

-- ============================================================================
-- REAL-TIME COLLABORATION: Active editing sessions
-- ============================================================================
CREATE TABLE public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Session state
  cursor_position INTEGER,
  selection_start INTEGER,
  selection_end INTEGER,

  -- WebSocket connection
  connection_id VARCHAR(100) UNIQUE NOT NULL,

  -- Activity tracking
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(note_id, user_id)
);
```

### Indexes

```sql
-- Notes indexes
CREATE INDEX idx_notes_org_user ON public.notes(org_id, user_id);
CREATE INDEX idx_notes_notebook ON public.notes(notebook_id) WHERE notebook_id IS NOT NULL;
CREATE INDEX idx_notes_updated ON public.notes(updated_at DESC);
CREATE INDEX idx_notes_pinned ON public.notes(org_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_search ON public.notes USING GIN(search_vector);

-- Tags indexes
CREATE INDEX idx_tags_org ON public.tags(org_id);
CREATE INDEX idx_note_tags_note ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag ON public.note_tags(tag_id);

-- Attachments indexes
CREATE INDEX idx_attachments_note ON public.attachments(note_id);
CREATE INDEX idx_attachments_scan_pending ON public.attachments(virus_scan_status)
  WHERE virus_scan_status = 'pending';

-- Sharing indexes
CREATE INDEX idx_note_shares_note ON public.note_shares(note_id);
CREATE INDEX idx_note_shares_user ON public.note_shares(shared_with_user_id)
  WHERE shared_with_user_id IS NOT NULL;
CREATE INDEX idx_note_shares_public ON public.note_shares(public_link_token)
  WHERE is_public_link = true;

-- Comments indexes
CREATE INDEX idx_note_comments_note ON public.note_comments(note_id);
CREATE INDEX idx_note_comments_parent ON public.note_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- Version history indexes
CREATE INDEX idx_note_versions_note ON public.note_versions(note_id, version_number DESC);

-- Active sessions indexes
CREATE INDEX idx_active_sessions_note ON public.active_sessions(note_id);
CREATE INDEX idx_active_sessions_user ON public.active_sessions(user_id);
CREATE INDEX idx_active_sessions_activity ON public.active_sessions(last_activity_at);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;

-- Notes policy: Users can only access their org's notes + shared notes
CREATE POLICY notes_org_isolation ON public.notes
  USING (
    org_id = current_setting('app.current_org_id')::uuid
    OR
    id IN (
      SELECT note_id FROM public.note_shares
      WHERE shared_with_user_id = current_setting('app.current_user_id')::uuid
      OR (is_public_link = true AND public_link_expires_at > now())
    )
  );

-- Notebooks policy: Users can only access their org's notebooks
CREATE POLICY notebooks_org_isolation ON public.notebooks
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Shares policy: Users can only see shares they have access to
CREATE POLICY shares_access ON public.note_shares
  USING (
    shared_with_user_id = current_setting('app.current_user_id')::uuid
    OR shared_by = current_setting('app.current_user_id')::uuid
    OR shared_with_org_id = current_setting('app.current_org_id')::uuid
  );

-- Comments policy: Users can only see comments on notes they can access
CREATE POLICY comments_note_access ON public.note_comments
  USING (
    note_id IN (
      SELECT id FROM public.notes
      WHERE org_id = current_setting('app.current_org_id')::uuid
    )
  );
```

### Database Triggers

```sql
-- Auto-update search_vector on note changes
CREATE OR REPLACE FUNCTION update_note_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_vector_update
  BEFORE INSERT OR UPDATE OF title, content
  ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_note_search_vector();

-- Auto-update content_preview
CREATE OR REPLACE FUNCTION update_note_preview()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_preview := LEFT(
    regexp_replace(COALESCE(NEW.content, ''), '[#*_`\[\]()]', '', 'g'),
    200
  );
  NEW.word_count := array_length(
    regexp_split_to_array(COALESCE(NEW.content, ''), '\s+'),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_preview_update
  BEFORE INSERT OR UPDATE OF content
  ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_note_preview();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## 🔌 3. API Endpoints

### Authentication
All endpoints require valid JWT from Core Identity. See `03_core_identity_and_auth_architecture_v5.md` for authentication flow.

### Notes API (`/api/v1/notes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/notes` | List all notes (paginated, filtered) | Yes |
| `GET` | `/api/v1/notes/:id` | Get single note with full content | Yes |
| `POST` | `/api/v1/notes` | Create new note | Yes |
| `PUT` | `/api/v1/notes/:id` | Update note | Yes (owner or editor) |
| `DELETE` | `/api/v1/notes/:id` | Delete note (soft delete) | Yes (owner or admin) |
| `POST` | `/api/v1/notes/:id/pin` | Pin/unpin note | Yes |
| `POST` | `/api/v1/notes/:id/archive` | Archive/unarchive note | Yes |
| `POST` | `/api/v1/notes/:id/duplicate` | Duplicate note | Yes |
| `GET` | `/api/v1/notes/:id/versions` | Get version history | Yes |
| `POST` | `/api/v1/notes/:id/restore` | Restore to specific version | Yes (owner or admin) |

**List Notes Query Parameters:**
```typescript
interface ListNotesQuery {
  page?: number;              // Pagination (default: 1)
  limit?: number;             // Items per page (default: 50, max: 100)
  notebook_id?: string;       // Filter by notebook
  tag_ids?: string[];         // Filter by tags (AND logic)
  search?: string;            // Full-text search
  is_pinned?: boolean;        // Filter pinned notes
  is_archived?: boolean;      // Include archived (default: false)
  sort_by?: 'updated_at' | 'created_at' | 'title'; // Sort field
  sort_order?: 'asc' | 'desc'; // Sort direction (default: desc)
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "uuid",
        "title": "Meeting Notes",
        "content_preview": "Discussed quarterly goals...",
        "word_count": 250,
        "is_pinned": false,
        "is_archived": false,
        "notebook": { "id": "uuid", "name": "Work" },
        "tags": [{ "id": "uuid", "name": "meeting", "color": "#EF4444" }],
        "created_at": "2025-11-04T10:00:00Z",
        "updated_at": "2025-11-04T12:30:00Z",
        "last_edited_by": { "id": "uuid", "name": "John Doe" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 142,
      "total_pages": 3
    }
  }
}
```

### Notebooks API (`/api/v1/notebooks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/notebooks` | List all notebooks |
| `GET` | `/api/v1/notebooks/:id` | Get notebook with note count |
| `POST` | `/api/v1/notebooks` | Create notebook |
| `PUT` | `/api/v1/notebooks/:id` | Update notebook |
| `DELETE` | `/api/v1/notebooks/:id` | Delete notebook |
| `GET` | `/api/v1/notebooks/:id/notes` | Get all notes in notebook |

### Tags API (`/api/v1/tags`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/tags` | List all tags (with usage count) |
| `POST` | `/api/v1/tags` | Create new tag |
| `PUT` | `/api/v1/tags/:id` | Update tag (name, color) |
| `DELETE` | `/api/v1/tags/:id` | Delete tag |
| `POST` | `/api/v1/notes/:id/tags` | Add tags to note |
| `DELETE` | `/api/v1/notes/:id/tags/:tagId` | Remove tag from note |

### Attachments API (`/api/v1/attachments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/notes/:id/attachments` | Upload file (multipart/form-data) |
| `GET` | `/api/v1/attachments/:id` | Get attachment metadata |
| `DELETE` | `/api/v1/attachments/:id` | Delete attachment |
| `GET` | `/api/v1/attachments/:id/download` | Download file (presigned URL) |

**Upload Flow:**
1. Client uploads file to `/api/v1/notes/:id/attachments`
2. Server validates file type, size (max 10MB per file)
3. Server scans file with VirusTotal API (async)
4. Server uploads to S3/R2 with presigned URL
5. Server returns attachment metadata

### Sharing API (`/api/v1/shares`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/notes/:id/share` | Share note with user/org/public |
| `GET` | `/api/v1/notes/:id/shares` | List all shares for note |
| `PUT` | `/api/v1/shares/:id` | Update share permissions |
| `DELETE` | `/api/v1/shares/:id` | Revoke share |
| `GET` | `/api/v1/shares/public/:token` | Access public shared note |

**Share Request:**
```json
{
  "shared_with_user_id": "uuid", // OR
  "shared_with_org_id": "uuid",  // OR
  "is_public_link": true,
  "permission": "view", // view, comment, edit
  "expires_in_days": 7 // Optional expiry
}
```

### Comments API (`/api/v1/comments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/notes/:id/comments` | Add comment |
| `GET` | `/api/v1/notes/:id/comments` | Get all comments (threaded) |
| `PUT` | `/api/v1/comments/:id` | Update comment |
| `DELETE` | `/api/v1/comments/:id` | Delete comment |
| `POST` | `/api/v1/comments/:id/resolve` | Mark comment as resolved |

### Search API (`/api/v1/search`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/search` | Full-text search across notes |
| `GET` | `/api/v1/search/suggestions` | Search autocomplete |

**Search Query:**
```typescript
interface SearchQuery {
  q: string;                   // Search query
  filters?: {
    notebook_ids?: string[];
    tag_ids?: string[];
    date_from?: string;        // ISO date
    date_to?: string;
  };
  limit?: number;              // Max results (default: 20)
}
```

---

## 🔄 4. Real-Time Collaboration

### WebSocket Architecture

```
┌─────────────┐        WebSocket         ┌─────────────┐
│   Client    │ ◄────────────────────────► │   Server    │
│  (Browser)  │                            │  (Node.js)  │
└─────────────┘                            └─────────────┘
                                                  │
                                                  ▼
                                           ┌─────────────┐
                                           │    Redis    │
                                           │ (Pub/Sub)   │
                                           └─────────────┘
```

### WebSocket Events

**Client → Server:**
```typescript
// Join note editing session
{
  "event": "note:join",
  "data": {
    "note_id": "uuid",
    "cursor_position": 0
  }
}

// Send content changes
{
  "event": "note:edit",
  "data": {
    "note_id": "uuid",
    "operations": [
      { "type": "insert", "position": 10, "text": "Hello" },
      { "type": "delete", "position": 5, "length": 3 }
    ]
  }
}

// Update cursor position
{
  "event": "cursor:move",
  "data": {
    "note_id": "uuid",
    "position": 125,
    "selection": { "start": 125, "end": 135 }
  }
}

// Leave session
{
  "event": "note:leave",
  "data": { "note_id": "uuid" }
}
```

**Server → Client:**
```typescript
// User joined
{
  "event": "user:joined",
  "data": {
    "user_id": "uuid",
    "user_name": "John Doe",
    "cursor_position": 0
  }
}

// Broadcast edits
{
  "event": "note:edited",
  "data": {
    "user_id": "uuid",
    "operations": [...],
    "version": 42
  }
}

// Cursor position update
{
  "event": "cursor:updated",
  "data": {
    "user_id": "uuid",
    "position": 125
  }
}

// User left
{
  "event": "user:left",
  "data": { "user_id": "uuid" }
}
```

### Operational Transformation (OT)

**Purpose:** Resolve conflicts when multiple users edit simultaneously.

**Algorithm:** Last-Write-Wins with timestamp-based conflict resolution.

**For advanced use cases:** Consider implementing Yjs or Automerge for CRDT-based collaboration.

```typescript
// Example: Simple OT transformation
function transformOperation(op1, op2) {
  if (op1.position < op2.position) {
    return op1; // No conflict
  }

  if (op1.type === 'insert' && op2.type === 'insert') {
    // Both insertions at same position → use timestamp
    return op1.timestamp > op2.timestamp ? op1 : op2;
  }

  // Handle delete, replace operations...
}
```

---

## 💾 5. Caching Strategy

**Platform Cache:** See platform-wide caching standards. This section covers **Notes-specific** cache keys.

### Redis Cache Keys

```typescript
// Note lists (5-minute TTL)
`notes:list:{user_id}:{page}:{filters_hash}`

// Single note (10-minute TTL)
`notes:detail:{note_id}`

// Search results (3-minute TTL)
`notes:search:{query_hash}:{user_id}`

// Notebooks list (15-minute TTL)
`notebooks:list:{org_id}`

// Tags list (15-minute TTL)
`tags:list:{org_id}`

// Active sessions (real-time, expires on disconnect)
`sessions:note:{note_id}:users`
```

### Cache Invalidation Rules

| Event | Invalidate Keys |
|-------|----------------|
| Note created/updated/deleted | `notes:list:*`, `notes:detail:{note_id}`, `notes:search:*` |
| Notebook created/updated | `notebooks:list:{org_id}` |
| Tag created/updated | `tags:list:{org_id}`, `notes:list:*` |
| Note shared | `notes:list:*` (for shared user) |

---

## 📁 6. File Attachments Flow

### Upload Process

```
1. Client → POST /api/v1/notes/:id/attachments
   ↓
2. Server validates file (type, size, extension)
   ↓
3. Server generates presigned S3/R2 URL
   ↓
4. Server triggers async virus scan (VirusTotal API)
   ↓
5. Server saves metadata to DB (status: pending)
   ↓
6. Client uploads to S3/R2 using presigned URL
   ↓
7. Server receives upload confirmation
   ↓
8. Virus scan completes (status: clean | infected)
   ↓
9. If infected → delete file, notify user
   ↓
10. If clean → update status, generate thumbnail (for images)
```

### File Storage Structure

```
s3://vorklee-attachments-prod/
  {org_id}/
    {note_id}/
      {attachment_id}/
        original.{ext}
        thumbnail.jpg (for images)
```

### Supported File Types

| Category | MIME Types | Max Size |
|----------|-----------|----------|
| **Images** | image/png, image/jpeg, image/gif, image/webp | 10 MB |
| **Documents** | application/pdf, application/msword, .docx, .xlsx, .pptx | 10 MB |
| **Code** | text/plain, application/json, text/markdown | 5 MB |
| **Archives** | application/zip, application/x-tar | 25 MB |

---

## 🔍 7. Full-Text Search

### PostgreSQL Full-Text Search

**Search Vector:** Automatically updated via trigger (see database schema).

**Search Query:**
```sql
SELECT id, title, content_preview,
       ts_rank(search_vector, plainto_tsquery('english', $1)) AS rank
FROM notes
WHERE search_vector @@ plainto_tsquery('english', $1)
  AND org_id = $2
ORDER BY rank DESC, updated_at DESC
LIMIT 20;
```

### Future: Vector Search (Optional)

**For semantic search, consider:**
- Pinecone / Qdrant vector database
- OpenAI text-embedding-ada-002 for embeddings
- Similarity search for "find similar notes"

**Implementation:** See `00_PLATFORM_EXCELLENCE_SUMMARY_v5.md` for AI/ML infrastructure.

---

## 📤 8. Event Emission

**Events published to platform event bus (Kafka/RabbitMQ):**

| Event | Payload | Consumers |
|-------|---------|-----------|
| `notes.created` | `{ note_id, user_id, org_id, title }` | Analytics, Core |
| `notes.updated` | `{ note_id, user_id, version }` | Analytics |
| `notes.deleted` | `{ note_id, user_id }` | Analytics, Core |
| `notes.shared` | `{ note_id, shared_with, permission }` | Analytics, Core |
| `attachments.uploaded` | `{ attachment_id, note_id, file_type, file_size }` | Analytics |

**Event Format:**
```json
{
  "event_type": "notes.created",
  "timestamp": "2025-11-04T10:00:00Z",
  "trace_id": "uuid",
  "payload": {
    "note_id": "uuid",
    "user_id": "uuid",
    "org_id": "uuid",
    "title": "Meeting Notes"
  }
}
```

---

## 🔗 9. Integration with Core Identity

**Authentication Flow:** See `03_core_identity_and_auth_architecture_v5.md`

**Notes App Implementation:**

```typescript
// Middleware: Verify JWT and set RLS context
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Verify JWT with Core Identity public key
  const payload = await verifyJWT(token);

  // Set RLS context variables
  await db.query(`
    SET app.current_user_id = '${payload.user_id}';
    SET app.current_org_id = '${payload.org_id}';
  `);

  req.user = payload;
  next();
}

// Check app-specific permissions
export async function checkNotePermission(userId, noteId, permission) {
  // Check if user is owner
  const note = await db.notes.findOne({ id: noteId });
  if (note.user_id === userId) return true;

  // Check if note is shared with user
  const share = await db.note_shares.findOne({
    note_id: noteId,
    shared_with_user_id: userId,
  });

  if (!share) return false;

  // Validate permission level
  const permissionHierarchy = { view: 1, comment: 2, edit: 3 };
  return permissionHierarchy[share.permission] >= permissionHierarchy[permission];
}
```

---

## ✅ 10. Summary

The **Notes App Architecture** is designed as an **independent, scalable service** that integrates seamlessly with the Vorklee2 platform.

**Key Design Decisions:**
- **Independent Neon project** for data isolation and scalability
- **Comprehensive schema** supporting notebooks, tags, sharing, comments, version history
- **Real-time collaboration** via WebSocket with operational transformation
- **Full-text search** with PostgreSQL GIN indexes (with optional vector search upgrade path)
- **Secure file attachments** with virus scanning and presigned URLs
- **Granular sharing** at user, org, and public link levels
- **Event-driven integration** with platform analytics and core services

**Integration Points:**
- **Authentication:** JWT validation with Core Identity
- **Storage:** Platform S3/R2 for attachments
- **Cache:** Shared Redis for performance
- **Analytics:** Event emission for usage tracking
- **Security:** Platform-wide RLS, encryption, compliance standards

**For platform-wide standards, refer to:**
- `00_PLATFORM_EXCELLENCE_SUMMARY_v5.md` - Overall architecture
- `03_core_identity_and_auth_architecture_v5.md` - Authentication
- `06_engineering_and_security_guidelines_v5.md` - Security, CI/CD, testing
- `10_mobile_and_web_platform_standards_v5.md` - Mobile support

---

**End of File — 01_notes_app_architecture_blueprint_v5.md**
