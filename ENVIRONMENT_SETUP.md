# 🔧 Environment Setup Guide.

## ⚠️ IMPORTANT: Create `.env.local` Files

You need to manually create `.env.local` files for both apps. These files contain sensitive information and are git-ignored.

---

## 📝 Step 1: Create Environment Files

### For `apps/notes/.env.local`:

Create the file and paste this content:

```env
# Database - Notes App (Neon branch: notes-db)
# Replace with your actual NeonDB connection string
DATABASE_URL_NOTES=postgresql://username:password@your-neon-host.com/notes

# Redis Cache (optional for development, leave empty if not using)
# REDIS_URL=redis://localhost:6379

# Core Platform API
CORE_API_URL=http://localhost:3000/api

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Skip authentication for development (REMOVE IN PRODUCTION!)
SKIP_AUTH=true
```

### For `apps/core/.env.local`:

Create the file and paste this content:

```env
# Database - Core Platform (Neon branch: core-db)
# Replace with your actual NeonDB connection string
DATABASE_URL_CORE=postgresql://username:password@your-neon-host.com/core

# Redis Cache (optional for development, leave empty if not using)
# REDIS_URL=redis://localhost:6379

# JWT Secret (change in production!)
JWT_SECRET=dev-jwt-secret-key-change-me-in-production-1234567890

# Platform URLs
NEXT_PUBLIC_PLATFORM_URL=http://localhost:3000
```

---

## 🗄️ Step 2: Set Up NeonDB

### Option A: Using Neon Dashboard

1. Go to [https://neon.tech](https://neon.tech)
2. Sign in or create an account
3. Create a new project named `vorklee2`
4. Create two branches:
   - `core-db` (for Core Platform)
   - `notes-db` (for Notes App)
5. For each branch, get the connection string from the "Connection Details" section
6. Copy the connection strings into your `.env.local` files

### Option B: Using Neon CLI

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

# Get connection strings
neonctl connectionstring --project vorklee2 --branch core-db
neonctl connectionstring --project vorklee2 --branch notes-db
```

---

## 🚀 Step 3: Push Database Schemas

Once your database URLs are set up, run:

```bash
# Push Core Platform schema
cd apps/core
npm run db:push

# Push Notes App schema
cd ../notes
npm run db:push

# Return to root
cd ../..
```

---

## 🌱 Step 4: Seed Test Data (Optional)

To populate the Notes app with test data:

```bash
cd apps/notes
npm run db:seed
```

This will create:
- 1 test notebook
- 1 test tag
- 3 sample notes

---

## ✅ Step 5: Verify Setup

1. Start the development servers:
   ```bash
   npm run dev
   ```

2. Access the apps:
   - Core Platform: http://localhost:3000
   - Notes App: http://localhost:3001

3. Check the dashboard at http://localhost:3001/dashboard

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL_NOTES environment variable is not set"

Make sure you've created `apps/notes/.env.local` with the correct database URL.

### Error: "Cannot connect to database"

1. Verify your NeonDB connection string is correct
2. Check that your Neon project is active
3. Ensure your database branch is created

### Error: "REDIS_URL environment variable is not set"

Redis is optional for development. You can:
1. Leave `REDIS_URL` commented out in `.env.local`
2. Or set up a local Redis instance
3. The app will gracefully handle missing Redis

### Error: "Port already in use"

Kill the process using the port:
```bash
npx kill-port 3000 3001
```

---

## 📚 Next Steps

After environment setup is complete:

1. ✅ Push database schemas
2. ✅ Seed test data
3. ✅ Start development servers
4. ✅ Test the Notes app functionality
5. ✅ Build new features!

---

## 🔒 Security Reminders

- ⚠️ **Never commit** `.env.local` files to git
- ⚠️ **Change** `JWT_SECRET` in production
- ⚠️ **Use strong passwords** for production databases
- ⚠️ **Enable** 2FA for your NeonDB account
- ⚠️ **Remove** `SKIP_AUTH=true` before production deployment

---

**Need Help?** Check the main [README.md](./README.md) or [SETUP.md](./SETUP.md) for more details.

