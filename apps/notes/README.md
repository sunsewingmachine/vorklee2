# 📝 Notes App - Vorklee2

Enterprise-grade collaborative note-taking application built on the Vorklee2 platform.

## 🌟 Features

### Core Features
- ✅ **Rich Notes**: Create and edit notes with markdown support
- ✅ **Notebooks**: Organize notes into notebooks (folders)
- ✅ **Tags**: Categorize notes with color-coded tags
- ✅ **Attachments**: Add files and media to notes
- ✅ **Pin Notes**: Keep important notes at the top
- ✅ **Archive**: Soft-delete notes with restore capability
- ✅ **Search**: Fast full-text search across all notes

### Enterprise Features
- 🔒 **Authentication**: Secure JWT-based authentication
- 👥 **Organization Isolation**: Multi-tenant architecture
- 📊 **Analytics**: Usage tracking and insights
- 🔍 **Audit Logs**: Complete action history
- 💳 **Subscription Tiers**: Free, Pro, Business, Enterprise
- 🚀 **Scalable**: Built for growth
- 📱 **Responsive**: Works on mobile, tablet, and desktop

### Coming Soon
- 🤝 **Real-time Collaboration**: Multi-user editing
- 🤖 **AI Summaries**: Automatic note summarization
- 🔗 **Knowledge Graph**: Cross-link notes
- 🌙 **Dark Mode**: Theme customization
- 📤 **Export**: PDF, Markdown, HTML
- 🔄 **Offline Mode**: IndexedDB caching

## 🏗️ Architecture

### Database Schema

```
app_users        # Users specific to Notes App
notebooks        # Folder-like organization
notes            # Main notes content
tags             # Categorization labels
note_tags        # Many-to-many relationship
attachments      # File references
```

### API Routes

```
GET    /api/notes              # List all notes
POST   /api/notes              # Create note
GET    /api/notes/[id]         # Get single note
PATCH  /api/notes/[id]         # Update note
DELETE /api/notes/[id]         # Archive note

GET    /api/notebooks          # List notebooks
POST   /api/notebooks          # Create notebook
GET    /api/notebooks/[id]     # Get notebook
PATCH  /api/notebooks/[id]     # Update notebook
DELETE /api/notebooks/[id]     # Delete notebook

GET    /api/tags               # List tags
POST   /api/tags               # Create tag
```

### UI Pages

```
/                              # Landing page
/dashboard                     # All notes (default view)
/dashboard/notebooks           # Notebooks management
/dashboard/tags                # Tags management
/dashboard/search              # Search interface
/dashboard/settings            # User settings
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended)
- Redis (for caching)

### Setup

1. **Install dependencies**
   ```bash
   cd apps/notes
   npm install
   ```

2. **Configure environment**
   
   Create `.env.local`:
   ```env
   # Database (Neon branch: notes-db)
   DATABASE_URL_NOTES=postgresql://user:password@host/notes
   
   # Core Platform API
   CORE_API_URL=http://localhost:3000/api/core
   
   # Redis Cache
   REDIS_URL=redis://localhost:6379
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

3. **Push database schema**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3001
   ```

## 📚 Usage

### Creating a Note

```typescript
// POST /api/notes
{
  "title": "Meeting Notes",
  "content": "Discussion points...",
  "notebookId": "uuid-here",
  "isPinned": false
}
```

### Updating a Note

```typescript
// PATCH /api/notes/[id]
{
  "title": "Updated Title",
  "content": "New content...",
  "isPinned": true
}
```

### Creating a Notebook

```typescript
// POST /api/notebooks
{
  "name": "Work Projects",
  "description": "All work-related notes",
  "color": "#1976d2"
}
```

### Creating a Tag

```typescript
// POST /api/tags
{
  "name": "Important",
  "color": "#dc004e"
}
```

## 🎨 UI Components

### Material UI v7
- Consistent design system
- Responsive layouts
- Accessibility built-in
- Custom theme support

### TanStack Query
- Optimistic updates
- Automatic caching
- Background refetching
- Error handling

## 🔒 Security

### Authentication
- JWT tokens via `@core-auth`
- httpOnly cookies
- Middleware protection

### Authorization
- Organization-level isolation
- Row-level security
- Role-based permissions

### Validation
- Zod schemas for all inputs
- Server-side validation
- Type-safe API calls

## 📊 Subscription Tiers

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| Notes | 50 | Unlimited | Unlimited | Unlimited |
| Notebooks | 3 | Unlimited | Unlimited | Unlimited |
| Tags | 10 | Unlimited | Unlimited | Unlimited |
| Attachments | ❌ | ✅ | ✅ | ✅ |
| AI Summaries | ❌ | ✅ | ✅ | ✅ |
| Team Sharing | ❌ | ❌ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ❌ | ✅ |
| SSO | ❌ | ❌ | ❌ | ✅ |

## 🧪 Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Build

```bash
npm run build
```

### Start Production

```bash
npm run start
```

### Environment Variables (Production)

```env
DATABASE_URL_NOTES=postgresql://...
CORE_API_URL=https://api.vorklee2.com
REDIS_URL=redis://...
NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com
```

## 📈 Performance

### Optimization Strategies
- Server Components by default
- TanStack Query caching
- Redis for hot data
- Optimistic UI updates
- Lazy loading for large lists

### Target Metrics
- Lighthouse Score: ≥90
- First Contentful Paint: <1.5s
- Time to Interactive: <3.0s
- Load Time: <2.0s

## 🐛 Troubleshooting

### Common Issues

**Database connection error**
```bash
# Check DATABASE_URL_NOTES is set
echo $DATABASE_URL_NOTES

# Push schema again
npm run db:push
```

**Authentication error**
```bash
# Ensure Core Platform is running
curl http://localhost:3000

# Check JWT_SECRET matches Core
```

**Redis connection error**
```bash
# Check Redis is running
redis-cli ping

# Update REDIS_URL in .env.local
```

## 📞 Support

For issues or questions:
- Email: support@vorklee2.com
- Documentation: [docs.vorklee2.com](https://docs.vorklee2.com)
- Status: [status.vorklee2.com](https://status.vorklee2.com)

## 🔗 Links

- [Main Platform](../../README.md)
- [Architecture Blueprint](../../AppSpecV3/notes_app_1_architecture_blueprint.md)
- [Product Blueprint](../../AppSpecV3/notes_app_2_product_and_business_blueprint.md)
- [API Documentation](./docs/API.md)

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-30  
**License**: Proprietary

