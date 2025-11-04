# 📝 Notes App V5 - Development Setup Guide

Complete guide to setting up and running the Vorklee2 Notes app with V5 enhancements.

---

## 🆕 What's New in V5

### Enhanced Features
- ✅ **Sharing & Permissions**: Share notes with users, orgs, or via public links
- ✅ **Comments & Collaboration**: Threaded comments with inline positioning
- ✅ **Version History**: Full version tracking with restore capability
- ✅ **Full-Text Search**: PostgreSQL-powered search with relevance ranking
- ✅ **Real-Time Collaboration**: WebSocket support for multi-user editing (coming soon)
- ✅ **Enhanced Schema**: Content preview, word count, templates support

### Database Improvements
- PostgreSQL full-text search vectors (tsvector)
- Auto-update triggers for search indexes
- Row-Level Security (RLS) policies ready
- Comprehensive indexes for performance
- Enhanced attachment support with virus scanning

---

## 📋 Prerequisites

### Required Software
- **Node.js**: v20 or higher
- **PostgreSQL**: v14+ (Neon recommended)
- **Redis**: v6+ (for caching and sessions)
- **Git**: Latest version

### Recommended Tools
- **VSCode** with ESLint and Prettier extensions
- **Postman** or **Insomnia** for API testing
- **DBeaver** or **pgAdmin** for database management

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/vorklee2.git
cd vorklee2
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Navigate to notes app
cd apps/notes
npm install
```

### 3. Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database (Neon PostgreSQL)
DATABASE_URL_NOTES=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/vorklee_notes?sslmode=require

# Core Platform
CORE_API_URL=http://localhost:3000/api/core

# Redis Cache
REDIS_URL=redis://localhost:6379

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
PORT=3001

# Feature Flags
FEATURE_REALTIME_COLLABORATION=false
FEATURE_VIRUS_SCANNING=false
DEV_SKIP_AUTH=true  # For development only
```

### 4. Set Up Database

#### Option A: Using Neon (Recommended)

1. **Create Neon Project**:
   - Go to [Neon Console](https://console.neon.tech)
   - Create new project: `vorklee-notes-prod`
   - Create database: `vorklee_notes`
   - Copy connection string to `.env.local`

2. **Push Schema**:
   ```bash
   npm run db:push
   ```

3. **Run Migrations**:
   ```bash
   npm run db:init
   ```

#### Option B: Local PostgreSQL

1. **Create Database**:
   ```bash
   createdb vorklee_notes
   ```

2. **Update `.env.local`**:
   ```env
   DATABASE_URL_NOTES=postgresql://localhost:5432/vorklee_notes
   ```

3. **Push Schema & Migrate**:
   ```bash
   npm run db:push
   npm run db:init
   ```

### 5. Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3001**

---

## 🗄️ Database Schema

### V5 Tables

| Table | Description |
|-------|-------------|
| `notebooks` | Organize notes into collections |
| `notes` | Core note content with search vectors |
| `tags` | Flexible categorization |
| `note_tags` | Many-to-many note-tag relationship |
| `attachments` | File uploads with virus scanning |
| `note_shares` | Sharing and permissions |
| `note_comments` | Threaded comments |
| `note_versions` | Version history |
| `active_sessions` | Real-time collaboration sessions |

### Key Features

**Full-Text Search**:
```sql
-- search_vector automatically updated via trigger
SELECT * FROM notes
WHERE search_vector @@ plainto_tsquery('english', 'meeting notes')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'meeting notes')) DESC;
```

**Auto-Update Triggers**:
- `update_note_search_vector()`: Updates search index on title/content change
- `update_note_preview()`: Generates content preview and word count
- `update_updated_at()`: Auto-updates timestamp

---

## 🔌 API Endpoints

### Core Notes API

```bash
GET    /api/notes              # List all notes (paginated, filtered)
POST   /api/notes              # Create new note
GET    /api/notes/:id          # Get single note
PATCH  /api/notes/:id          # Update note
DELETE /api/notes/:id          # Delete note
```

### V5 New Endpoints

```bash
# Sharing
POST   /api/notes/:id/share    # Share note (user/org/public)
GET    /api/notes/:id/share    # List all shares

# Comments
POST   /api/notes/:id/comments # Add comment (threaded)
GET    /api/notes/:id/comments # Get all comments

# Version History
GET    /api/notes/:id/versions # Get version history
POST   /api/notes/:id/restore  # Restore to version

# Search
GET    /api/search             # Full-text search with filters
```

---

## 📚 Usage Examples

### Create a Note

```bash
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting Notes - Q4 Planning",
    "content": "## Agenda\n\n1. Review Q3\n2. Set Q4 goals",
    "notebookId": "uuid-here",
    "isPinned": false
  }'
```

### Share a Note

```bash
# Share with user
curl -X POST http://localhost:3001/api/notes/:id/share \
  -H "Content-Type: application/json" \
  -d '{
    "sharedWithUserId": "user-uuid",
    "permission": "edit"
  }'

# Create public link (expires in 7 days)
curl -X POST http://localhost:3001/api/notes/:id/share \
  -H "Content-Type: application/json" \
  -d '{
    "isPublicLink": true,
    "permission": "view",
    "expiresInDays": 7
  }'
```

### Add a Comment

```bash
# Regular comment
curl -X POST http://localhost:3001/api/notes/:id/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great notes! Can we add budget details?"
  }'

# Inline comment (at specific position)
curl -X POST http://localhost:3001/api/notes/:id/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Clarify this section",
    "positionStart": 120,
    "positionEnd": 150
  }'
```

### Search Notes

```bash
# Simple search
curl "http://localhost:3001/api/search?q=meeting"

# Advanced search with filters
curl "http://localhost:3001/api/search?q=planning&notebook_ids=uuid1,uuid2&date_from=2025-11-01"
```

### Restore Version

```bash
curl -X POST http://localhost:3001/api/notes/:id/restore \
  -H "Content-Type: application/json" \
  -d '{
    "versionNumber": 3
  }'
```

---

## 🧪 Testing

### Manual Testing

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Open Drizzle Studio** (Database GUI):
   ```bash
   npm run db:studio
   ```
   Visit: http://localhost:4983

3. **Test Database Connection**:
   ```bash
   npm run test:db
   ```

### API Testing with Postman

Import this collection for quick testing:

```json
{
  "info": { "name": "Vorklee Notes V5 API" },
  "item": [
    {
      "name": "Create Note",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/notes",
        "body": {
          "title": "Test Note",
          "content": "This is a test"
        }
      }
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Database Connection Error

**Error**: `Failed to connect to Neon database`

**Solution**:
```bash
# Check DATABASE_URL_NOTES is set
echo $DATABASE_URL_NOTES

# Test connection
npm run test:db

# Verify Neon project is active
# Check https://console.neon.tech
```

### Migration Errors

**Error**: `Trigger already exists`

**Solution**:
```bash
# Migrations use IF NOT EXISTS, so this is safe to ignore
# Or manually drop and recreate:
psql $DATABASE_URL_NOTES -c "DROP TRIGGER IF EXISTS notes_search_vector_update ON notes;"
npm run db:init
```

### Search Not Working

**Error**: `search_vector column does not exist`

**Solution**:
```bash
# Run migrations to add search vector
npm run db:init

# Verify column exists
npm run db:studio
# Check notes table for search_vector column
```

### Redis Connection Error

**Error**: `ECONNREFUSED localhost:6379`

**Solution**:
```bash
# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or disable Redis features temporarily
# In .env.local: REDIS_URL=
```

---

## 📦 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables (Production)

```env
DATABASE_URL_NOTES=postgresql://prod-user:prod-pass@prod-host/vorklee_notes?sslmode=require
CORE_API_URL=https://api.vorklee.com
REDIS_URL=redis://prod-redis:6379
NEXT_PUBLIC_APP_URL=https://notes.vorklee.com
NODE_ENV=production
FEATURE_REALTIME_COLLABORATION=true
FEATURE_VIRUS_SCANNING=true
DEV_SKIP_AUTH=false  # IMPORTANT: Must be false in production
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add environment variables in Vercel Dashboard:
- Settings → Environment Variables
- Add all variables from `.env.example`

---

## 📈 Performance Tips

### Database Optimization

1. **Enable Connection Pooling**:
   ```env
   DATABASE_URL_NOTES=postgresql://...?pgbouncer=true
   ```

2. **Monitor Query Performance**:
   ```bash
   npm run db:studio
   # Check slow queries in Logs tab
   ```

### Caching Strategy

```typescript
// Cache note lists for 5 minutes
const cacheKey = `notes:list:${orgId}:${page}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const notes = await db.select()...;
await redis.setex(cacheKey, 300, JSON.stringify(notes));
```

---

## 🔐 Security Checklist

- [ ] `DEV_SKIP_AUTH=false` in production
- [ ] Enable RLS policies (uncomment in migration)
- [ ] Use strong JWT_SECRET
- [ ] Enable virus scanning for attachments
- [ ] Set CORS_ORIGINS to specific domains
- [ ] Enable rate limiting
- [ ] Use HTTPS in production
- [ ] Encrypt sensitive environment variables

---

## 📞 Support

- **Documentation**: [V5 Specifications](../../V5%20Project%20Specifications/app_notes/)
- **Issues**: [GitHub Issues](https://github.com/your-org/vorklee2/issues)
- **Slack**: #notes-app-dev

---

## 🗺️ Next Steps

After setup is complete:

1. [ ] Test all API endpoints
2. [ ] Set up Core Platform integration
3. [ ] Implement authentication middleware
4. [ ] Build UI components
5. [ ] Add real-time collaboration
6. [ ] Deploy to staging
7. [ ] Run performance tests
8. [ ] Set up monitoring

---

**Version**: 5.0
**Last Updated**: 2025-11-04
**Maintainer**: Vorklee2 Notes Team
