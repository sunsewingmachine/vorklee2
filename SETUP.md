# 🛠️ Vorklee2 Setup Guide

Complete step-by-step setup instructions for the Vorklee2 platform.

## 📋 Prerequisites

### Required Software
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Git**: Latest version
- **PostgreSQL**: v15+ or NeonDB account (recommended)
- **Redis**: v7+ (optional for development, required for production)

### Development Tools (Optional)
- **Visual Studio Code**: Recommended IDE
- **Drizzle Kit**: For database management
- **Postman**: For API testing

## 🚀 Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/sunsewingmachine/vorklee2.git
cd vorklee2
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This will install dependencies for:
# - Root workspace
# - All apps (core, notes)
# - All packages (core-auth, core-utils, etc.)
```

### 3. Set Up Neon Database

#### Option A: Using Neon Dashboard (Recommended)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign in or create an account
3. Create new project: `vorklee2`
4. Create branches:
   - `core-db` (for Core Platform)
   - `notes-db` (for Notes App)
5. Copy connection strings from each branch

#### Option B: Using Neon CLI

```bash
# Install Neon CLI
npm install -g neonctl

# Login to Neon
neonctl login

# Create project
neonctl projects create vorklee2

# Create branches
neonctl branches create --project vorklee2 core-db
neonctl branches create --project vorklee2 notes-db

# Create databases
neonctl sql exec --project vorklee2 --branch core-db --command "CREATE DATABASE core;"
neonctl sql exec --project vorklee2 --branch notes-db --command "CREATE DATABASE notes;"
```

### 4. Configure Environment Variables

#### Core Platform

Create `apps/core/.env.local`:

```env
# Database - Core Platform (Neon branch: core-db)
DATABASE_URL_CORE=postgresql://user:password@vorklee2-core-db.neon.tech/core

# Redis Cache (optional for development)
REDIS_URL=redis://localhost:6379

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform URLs
NEXT_PUBLIC_PLATFORM_URL=http://localhost:3000
```

#### Notes App

Create `apps/notes/.env.local`:

```env
# Database - Notes App (Neon branch: notes-db)
DATABASE_URL_NOTES=postgresql://user:password@vorklee2-notes-db.neon.tech/notes

# Redis Cache
REDIS_URL=redis://localhost:6379

# Core Platform API
CORE_API_URL=http://localhost:3000/api/core

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 5. Push Database Schemas

```bash
# Core Platform
cd apps/core
npm run db:push

# Notes App
cd ../notes
npm run db:push

# Return to root
cd ../..
```

### 6. Verify Installation

```bash
# Check all packages
npm run lint

# Build all apps (optional)
npm run build
```

### 7. Start Development Servers

```bash
# Start all apps
npm run dev

# Or start individually:
# Core Platform only
npm run dev --filter=core

# Notes App only
npm run dev --filter=notes
```

### 8. Access Applications

- **Core Platform**: http://localhost:3000
- **Notes App**: http://localhost:3001

## 🔧 Redis Setup (Production)

### Local Redis (Development)

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Cloud Redis (Production)

**Upstash (Recommended)**
1. Go to [https://upstash.com](https://upstash.com)
2. Create new Redis database
3. Copy connection string
4. Update `REDIS_URL` in `.env.local`

**Alternative Options**
- Redis Cloud
- AWS ElastiCache
- DigitalOcean Managed Redis

## 📊 Database Management

### View Database

```bash
# Core Platform
cd apps/core
npm run db:studio

# Notes App
cd apps/notes
npm run db:studio
```

This opens Drizzle Studio at http://localhost:4983

### Migrations

```bash
# Generate migration
drizzle-kit generate

# Apply migration
drizzle-kit push
```

### Seed Database (Optional)

Create seed data for testing:

```bash
# Create seed script
cd apps/core
node scripts/seed.js
```

## 🧪 Testing Setup

### Install Testing Dependencies

```bash
# Root level
npm install -D jest @testing-library/react @testing-library/jest-dom

# E2E testing
npm install -D playwright @playwright/test
```

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚢 Production Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Core Platform**
   ```bash
   cd apps/core
   vercel --prod
   ```

4. **Deploy Notes App**
   ```bash
   cd apps/notes
   vercel --prod
   ```

5. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Navigate to Project Settings → Environment Variables
   - Add all variables from `.env.local`

### Environment Variables Checklist

Production environment variables:

**Core Platform**
- [ ] `DATABASE_URL_CORE`
- [ ] `REDIS_URL`
- [ ] `JWT_SECRET`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_PLATFORM_URL`

**Notes App**
- [ ] `DATABASE_URL_NOTES`
- [ ] `REDIS_URL`
- [ ] `CORE_API_URL`
- [ ] `NEXT_PUBLIC_APP_URL`

## 🔍 Troubleshooting

### Common Issues

#### "Cannot find module '@core-auth'"

```bash
# Rebuild workspace dependencies
npm install
npm run build
```

#### "Database connection failed"

```bash
# Verify connection string
echo $DATABASE_URL_CORE
echo $DATABASE_URL_NOTES

# Test connection
psql $DATABASE_URL_CORE -c "SELECT 1"
```

#### "Redis connection error"

```bash
# Check Redis is running
redis-cli ping

# For Docker users
docker run -d -p 6379:6379 redis:latest
```

#### "Port already in use"

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

## 📚 Next Steps

After setup:

1. ✅ Read [Main README](./README.md)
2. ✅ Review [Architecture Blueprint](./AppSpecV3/notes_app_1_architecture_blueprint.md)
3. ✅ Explore [API Documentation](./docs/API.md)
4. ✅ Check [Development Guidelines](./CONTRIBUTING.md)
5. ✅ Set up monitoring (Sentry, PostHog)

## 🤝 Support

Need help?

- 📧 Email: dev@vorklee2.com
- 📖 Docs: [docs.vorklee2.com](https://docs.vorklee2.com)
- 🐛 Issues: [GitHub Issues](https://github.com/sunsewingmachine/vorklee2/issues)

---

**Setup Complete!** 🎉 You're ready to build amazing apps on Vorklee2!


