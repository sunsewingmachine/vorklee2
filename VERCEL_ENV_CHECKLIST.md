# ✅ Vercel Environment Variables Checklist

## Core Platform Project (`apps/core`)

### Required Variables:
- [x] `DATABASE_URL_CORE` - Your Neon PostgreSQL connection string
- [x] `JWT_SECRET` - Strong secret key (change from placeholder!)
- [ ] `NEXT_PUBLIC_PLATFORM_URL` - Your production Core URL (e.g., `https://vorklee2-core.vercel.app`)
- [ ] `NEXT_PUBLIC_NOTES_APP_URL` - Your production Notes URL (for dashboard links)

### Optional Variables:
- [ ] `REDIS_URL` - Redis connection string (if using Redis)
- [ ] `NODE_ENV` - Set to `production` for production deployments

### Remove These (Not Needed):
- [ ] `PORT` - Vercel handles this automatically
- [ ] `EXAMPLE_NAME` - Test variable, remove it

---

## Notes App Project (`apps/notes`)

### Required Variables:
- [x] `DATABASE_URL_NOTES` - Your Neon PostgreSQL connection string
- [ ] `CORE_API_URL` - Your Core Platform API URL (e.g., `https://vorklee2-core.vercel.app/api`)
- [ ] `NEXT_PUBLIC_APP_URL` - Your production Notes URL (e.g., `https://vorklee2-notes.vercel.app`)

### Optional Variables:
- [ ] `REDIS_URL` - Redis connection string (if using Redis)
- [ ] `SKIP_AUTH` - Set to `true` only for development (NEVER in production!)
- [ ] `NODE_ENV` - Set to `production` for production deployments

### Remove These (Not Needed):
- [ ] `PORT` - Vercel handles this automatically
- [ ] `EXAMPLE_NAME` - Test variable, remove it

---

## 🔒 Security Checklist

- [ ] `JWT_SECRET` is a strong, random secret (not the placeholder!)
- [ ] `SKIP_AUTH` is NOT set to `true` in production
- [ ] Database URLs are production database URLs (not localhost)
- [ ] All URLs use `https://` in production (not `http://`)

---

## 📝 Quick Setup Steps

1. **Get your Vercel deployment URLs:**
   - After first deployment, Vercel will give you URLs like:
     - Core: `https://vorklee2-core.vercel.app`
     - Notes: `https://vorklee2-notes.vercel.app`

2. **Update Core Platform variables:**
   ```
   NEXT_PUBLIC_PLATFORM_URL=https://vorklee2-core.vercel.app
   NEXT_PUBLIC_NOTES_APP_URL=https://vorklee2-notes.vercel.app
   ```

3. **Update Notes App variables:**
   ```
   CORE_API_URL=https://vorklee2-core.vercel.app/api
   NEXT_PUBLIC_APP_URL=https://vorklee2-notes.vercel.app
   ```

4. **Set NODE_ENV for production:**
   ```
   NODE_ENV=production
   ```

5. **Redeploy after adding variables** - Vercel will automatically trigger a new deployment

---

## 🎯 Environment-Specific Values

### Production Environment:
- Use production database URLs
- Use production Vercel URLs (`https://...`)
- `NODE_ENV=production`
- `SKIP_AUTH` should NOT be set (or set to `false`)

### Preview Environment:
- Can use staging database or production database
- Use preview URLs (Vercel provides these)
- `NODE_ENV=production` (or leave unset)

### Development Environment:
- Use localhost URLs (`http://localhost:3000`)
- `NODE_ENV=development`
- `SKIP_AUTH=true` (optional, for local testing)

