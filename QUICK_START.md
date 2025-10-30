# ⚡ Quick Start Commands

Essential commands to get Vorklee2 up and running.

## 🚀 Initial Setup (First Time Only)

```bash
# 1. Navigate to project
cd D:\Files\Git\vorklee2

# 2. Install all dependencies
npm install

# 3. Create environment files
# Core Platform
cp apps/core/.env.example apps/core/.env.local
# Notes App  
cp apps/notes/.env.example apps/notes/.env.local

# 4. Edit .env.local files with your database URLs
# Use your text editor to update:
# - apps/core/.env.local
# - apps/notes/.env.local

# 5. Push database schemas
cd apps/core
npm run db:push
cd ../notes
npm run db:push
cd ../..
```

## 💻 Daily Development

```bash
# Start all apps
npm run dev

# Or start individually:
npm run dev --filter=core    # Core Platform only (port 3000)
npm run dev --filter=notes   # Notes App only (port 3001)
```

## 📊 Database Management

```bash
# View Core Platform database
cd apps/core
npm run db:studio

# View Notes App database
cd apps/notes
npm run db:studio
```

## 🧹 Code Quality

```bash
# Lint all code
npm run lint

# Build all apps
npm run build

# Run tests
npm run test
```

## 🔧 Troubleshooting

```bash
# Clean and reinstall
npm run clean
npm install

# Kill port 3000
npx kill-port 3000

# Kill port 3001
npx kill-port 3001
```

## 🌐 Access URLs

- **Core Platform**: http://localhost:3000
- **Notes App**: http://localhost:3001
- **Drizzle Studio**: http://localhost:4983

## 📝 Git Commands

```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Complete Vorklee2 platform"

# Push to GitHub
git push origin main

# Or if first push:
git branch -M main
git remote add origin https://github.com/sunsewingmachine/vorklee2.git
git push -u origin main
```

## 🔑 Environment Variables Required

### Core Platform (.env.local)
```env
DATABASE_URL_CORE=postgresql://user:password@host/core
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
NEXT_PUBLIC_PLATFORM_URL=http://localhost:3000
```

### Notes App (.env.local)
```env
DATABASE_URL_NOTES=postgresql://user:password@host/notes
REDIS_URL=redis://localhost:6379
CORE_API_URL=http://localhost:3000/api/core
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 🎯 What to Do Next

1. ✅ **Read**: `PROJECT_SUMMARY.md` for complete overview
2. ✅ **Setup**: Follow `SETUP.md` for detailed instructions
3. ✅ **Develop**: Start with `npm run dev`
4. ✅ **Deploy**: Check `DEPLOYMENT.md` when ready

---

**Need Help?** Check `README.md` for comprehensive documentation.

