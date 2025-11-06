# 🚀 Quick Vercel Deployment Guide

This guide will help you deploy your Vorklee2 monorepo to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: Prepare your production environment variables

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Deploy Core Platform

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Project Name**: `vorklee2-core` (or your preferred name)
   - **Root Directory**: `apps/core`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `cd ../.. && npm install`

5. **Add Environment Variables**:
   ```
   DATABASE_URL_CORE=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-production-secret-key
   NEXT_PUBLIC_PLATFORM_URL=https://your-core-domain.vercel.app
   ```

6. Click **"Deploy"**

#### Step 2: Deploy Notes App

1. Click **"Add New Project"** again
2. Import the same GitHub repository
3. Configure the project:
   - **Project Name**: `vorklee2-notes` (or your preferred name)
   - **Root Directory**: `apps/notes`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `cd ../.. && npm install`

4. **Add Environment Variables**:
   ```
   DATABASE_URL_NOTES=postgresql://...
   REDIS_URL=redis://...
   CORE_API_URL=https://your-core-domain.vercel.app/api
   NEXT_PUBLIC_APP_URL=https://your-notes-domain.vercel.app
   ```

5. Click **"Deploy"**

### Option 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy Core Platform

```bash
cd apps/core
vercel --prod
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account/team
- **Link to existing project?** → No (first time) or Yes (updates)
- **Project name?** → `vorklee2-core`
- **Directory?** → `apps/core` (should auto-detect)
- **Override settings?** → No

#### Step 4: Set Environment Variables for Core

```bash
vercel env add DATABASE_URL_CORE production
vercel env add REDIS_URL production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_PLATFORM_URL production
```

#### Step 5: Deploy Notes App

```bash
cd ../notes
vercel --prod
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account/team
- **Link to existing project?** → No (first time) or Yes (updates)
- **Project name?** → `vorklee2-notes`
- **Directory?** → `apps/notes` (should auto-detect)
- **Override settings?** → No

#### Step 6: Set Environment Variables for Notes

```bash
vercel env add DATABASE_URL_NOTES production
vercel env add REDIS_URL production
vercel env add CORE_API_URL production
vercel env add NEXT_PUBLIC_APP_URL production
```

## Important Configuration Notes

### Root Directory Setting

In Vercel Dashboard → Project Settings → General:
- **Root Directory**: Set to `apps/core` or `apps/notes` respectively
- This tells Vercel where your Next.js app is located

### Build Settings

The `vercel.json` files in each app directory configure:
- **Install Command**: Runs from root to install all workspace dependencies
- **Build Command**: Runs the Next.js build from the app directory
- **Output Directory**: `.next` (Next.js default)

### Monorepo Workspace Dependencies

Vercel will automatically:
1. Run `npm install` from the root directory (installs all workspace dependencies)
2. Build the specific app using the build command
3. Deploy the `.next` output directory

### ⚠️ CRITICAL: Environment Variables Must Be Set Before Build

**IMPORTANT**: You MUST add environment variables in Vercel BEFORE deploying, otherwise the build will fail!

1. Go to your Vercel project → Settings → Environment Variables
2. Add ALL required variables for **Production**, **Preview**, and **Development** environments
3. The variables are declared in `turbo.json` so Turborepo knows to pass them to the build

**Required Variables:**
- Core Platform: `DATABASE_URL_CORE`, `JWT_SECRET`, `NEXT_PUBLIC_PLATFORM_URL`
- Notes App: `DATABASE_URL_NOTES`, `CORE_API_URL`, `NEXT_PUBLIC_APP_URL`

**Note**: The database connection uses lazy initialization, but environment variables are still required during build for Next.js static analysis.

## Environment Variables Checklist

### Core Platform Required Variables:
- [ ] `DATABASE_URL_CORE` - Neon PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong secret for JWT tokens
- [ ] `NEXT_PUBLIC_PLATFORM_URL` - Your production URL
- [ ] `REDIS_URL` - (Optional) Redis connection string
- [ ] `STRIPE_SECRET_KEY` - (Optional) Stripe API key
- [ ] `STRIPE_WEBHOOK_SECRET` - (Optional) Stripe webhook secret

### Notes App Required Variables:
- [ ] `DATABASE_URL_NOTES` - Neon PostgreSQL connection string
- [ ] `CORE_API_URL` - Core platform API URL
- [ ] `NEXT_PUBLIC_APP_URL` - Your production Notes app URL
- [ ] `REDIS_URL` - (Optional) Redis connection string

## Post-Deployment Steps

1. **Verify Deployments**
   - Check both apps are accessible
   - Test authentication endpoints
   - Verify database connections

2. **Set Up Custom Domains** (Optional)
   - Core Platform: `app.yourdomain.com`
   - Notes App: `notes.yourdomain.com`
   - Vercel automatically provisions SSL certificates

3. **Configure Database**
   - Ensure production Neon databases are set up
   - Run migrations: `npm run db:push` (from respective app directories)

4. **Monitor**
   - Check Vercel Analytics
   - Set up error tracking (Sentry, etc.)
   - Monitor database connections

## Troubleshooting

### Build Fails with "Cannot find module"
- Ensure `installCommand` runs from root: `cd ../.. && npm install`
- Check that workspace dependencies are properly linked

### Environment Variables Not Working
- Verify variables are set for the correct environment (Production, Preview, Development)
- Check variable names match exactly (case-sensitive)

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon database is accessible from Vercel's IP ranges
- Ensure connection pooling is enabled if using Neon

## Quick Deploy Script

You can also use this script to deploy both apps:

```bash
#!/bin/bash
# deploy-vercel.sh

echo "Deploying Core Platform..."
cd apps/core
vercel --prod --yes

echo "Deploying Notes App..."
cd ../notes
vercel --prod --yes

echo "Deployment complete!"
```

## Next Steps

- [ ] Set up custom domains
- [ ] Configure production database
- [ ] Set up monitoring and alerts
- [ ] Configure CI/CD for automatic deployments
- [ ] Set up staging environment

---

**Need Help?** Check the [Vercel Documentation](https://vercel.com/docs) or [Turborepo + Vercel Guide](https://vercel.com/docs/monorepos/turborepo)

