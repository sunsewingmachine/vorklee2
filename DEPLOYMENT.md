# 🚀 Vorklee2 Deployment Guide

Production deployment guide for the Vorklee2 platform.

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No linting errors
- [ ] TypeScript compilation successful
- [ ] Build completes without errors
- [ ] Dependencies up to date

### Security
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials secured
- [ ] API keys in environment variables
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Database
- [ ] Neon production database created
- [ ] Database branches configured
- [ ] Schemas pushed successfully
- [ ] Backups enabled
- [ ] Connection pooling configured

### Infrastructure
- [ ] Redis cache configured
- [ ] CDN set up (optional)
- [ ] Domain names configured
- [ ] SSL certificates ready
- [ ] Monitoring tools integrated

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

#### Prerequisites
- Vercel account
- GitHub repository connected
- Environment variables prepared

#### Steps

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
   
   In Vercel Dashboard → Project Settings → Environment Variables:
   
   **Core Platform:**
   ```
   DATABASE_URL_CORE=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-production-secret
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_PLATFORM_URL=https://app.vorklee2.com
   ```
   
   **Notes App:**
   ```
   DATABASE_URL_NOTES=postgresql://...
   REDIS_URL=redis://...
   CORE_API_URL=https://app.vorklee2.com/api/core
   NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com
   ```

6. **Configure Custom Domains**
   - Core Platform: `app.vorklee2.com`
   - Notes App: `notes.vorklee2.com`

#### Vercel Configuration

Create `vercel.json` in root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/core/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/notes/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/core/(.*)",
      "dest": "apps/core/$1"
    },
    {
      "src": "/notes/(.*)",
      "dest": "apps/notes/$1"
    }
  ]
}
```

### Option 2: Docker + Cloud Provider

#### Build Docker Images

**Core Platform Dockerfile** (`apps/core/Dockerfile`):

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/core/package*.json ./apps/core/
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --filter=core

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/apps/core/.next/standalone ./
COPY --from=builder /app/apps/core/.next/static ./apps/core/.next/static
COPY --from=builder /app/apps/core/public ./apps/core/public

EXPOSE 3000
ENV PORT 3000
CMD ["node", "apps/core/server.js"]
```

#### Deploy to Cloud

**AWS ECS:**
```bash
# Build and push
docker build -t vorklee2-core:latest -f apps/core/Dockerfile .
docker tag vorklee2-core:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/vorklee2-core:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/vorklee2-core:latest

# Deploy to ECS
aws ecs update-service --cluster vorklee2 --service core --force-new-deployment
```

**Google Cloud Run:**
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/vorklee2-core
gcloud run deploy core --image gcr.io/PROJECT-ID/vorklee2-core --platform managed
```

**DigitalOcean App Platform:**
```bash
doctl apps create --spec .do/app.yaml
```

## 🗄️ Database Deployment

### Neon Production Setup

1. **Create Production Project**
   ```bash
   neonctl projects create vorklee2-prod --region us-east-1
   ```

2. **Create Branches**
   ```bash
   neonctl branches create --project vorklee2-prod core-db
   neonctl branches create --project vorklee2-prod notes-db
   ```

3. **Enable PITR (Point-in-Time Recovery)**
   ```bash
   neonctl branches update core-db --enable-pitr
   neonctl branches update notes-db --enable-pitr
   ```

4. **Configure Backups**
   - Navigate to Neon Dashboard
   - Enable automatic backups
   - Set retention period: 30 days
   - Enable S3 exports (optional)

5. **Connection Pooling**
   - Enable Neon's built-in pooling
   - Configure max connections per app

### Database Migration

```bash
# Production migration
npm run db:push --filter=core
npm run db:push --filter=notes
```

## 🔴 Redis Deployment

### Upstash (Recommended for Vercel)

1. Go to [https://upstash.com](https://upstash.com)
2. Create new Redis database
3. Choose region closest to your app
4. Enable TLS
5. Copy connection string
6. Update `REDIS_URL` in environment variables

### Redis Cloud

1. Go to [https://redis.com/cloud](https://redis.com/cloud)
2. Create subscription
3. Configure:
   - Memory: 256MB (start)
   - Replication: Yes
   - Backup: Daily
4. Copy connection string

### Self-Hosted Redis

```bash
# Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:latest redis-server --appendonly yes

# Kubernetes
kubectl apply -f k8s/redis-deployment.yaml
```

## 📊 Monitoring Setup

### Sentry (Error Tracking)

1. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure Sentry**
   
   Create `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 1.0,
   });
   ```

3. **Add to environment variables**
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

### PostHog (Analytics)

1. **Install PostHog**
   ```bash
   npm install posthog-js
   ```

2. **Configure**
   ```typescript
   import posthog from 'posthog-js';
   
   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
     api_host: 'https://app.posthog.com',
   });
   ```

### Uptime Monitoring

- **UptimeRobot**: Free tier monitors every 5 minutes
- **Pingdom**: Advanced monitoring with alerting
- **Checkly**: API and browser monitoring

## 🔒 Security Hardening

### SSL/TLS Configuration

```bash
# Vercel: Automatic SSL
# Custom domains automatically get SSL certificates

# For self-hosted, use Let's Encrypt:
certbot --nginx -d app.vorklee2.com -d notes.vorklee2.com
```

### Environment Variables

**Never commit:**
- API keys
- Database credentials
- JWT secrets
- Third-party tokens

**Use:**
- Vercel Environment Variables
- AWS Secrets Manager
- Google Cloud Secret Manager
- HashiCorp Vault

### Rate Limiting

Ensure Redis is configured for production rate limiting:

```typescript
// Update in @core-utils
export const productionRateLimiter = createRateLimiter({
  points: 1000,      // 1000 requests
  duration: 60,       // per minute
  blockDuration: 300, // block for 5 minutes if exceeded
});
```

### CORS Configuration

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://notes.vorklee2.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE' },
        ],
      },
    ];
  },
};
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🎯 Post-Deployment

### Verification Checklist

- [ ] Core Platform accessible
- [ ] Notes App accessible
- [ ] Authentication working
- [ ] Database connections stable
- [ ] Redis cache operational
- [ ] API endpoints responding
- [ ] Monitoring dashboards active
- [ ] SSL certificates valid
- [ ] Backups configured
- [ ] Logs streaming

### Health Checks

```bash
# Core Platform
curl https://app.vorklee2.com/api/health

# Notes App
curl https://notes.vorklee2.com/api/health
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

## 🚨 Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Restore from Neon backup
neonctl backups restore --branch core-db --timestamp 2025-10-30T10:00:00Z
```

## 📞 Support

Production issues:
- 🚨 Emergency: emergency@vorklee2.com
- 📧 Support: support@vorklee2.com
- 📖 Docs: https://docs.vorklee2.com
- 📊 Status: https://status.vorklee2.com

---

**Deployment Complete!** 🎉 Monitor your apps and ensure everything runs smoothly.

