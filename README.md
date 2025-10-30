# 🚀 Vorklee2 - Hybrid Multi-App SaaS Platform

A modern, scalable, enterprise-ready multi-app SaaS platform built with Next.js 15, Turborepo, and NeonDB.

## 🌟 Overview

Vorklee2 is a hybrid multi-app SaaS platform that provides a shared core infrastructure (authentication, billing, organizations, analytics) with independent app modules. Currently includes:

- **Core Platform**: Authentication, organization management, billing, analytics, and audit
- **Notes App**: Collaborative note-taking with notebooks, tags, and attachments

## 🏗️ Architecture

```
Vorklee2 Platform
├── Core Platform (Shared Services)
│   ├── Authentication (JWT-based)
│   ├── Organization Management
│   ├── Billing & Subscriptions
│   ├── Analytics & Audit
│   └── Shared Utilities
│
└── Apps (Independent Databases)
    ├── Notes App (Port 3001)
    └── Future Apps (Attendance, HR, etc.)
```

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.6
- **Monorepo**: Turborepo
- **Database**: NeonDB (PostgreSQL)
- **ORM**: Drizzle ORM
- **Cache**: Redis
- **UI**: Material UI v7
- **State Management**: TanStack Query

### Shared Packages
- `@core-auth` - JWT authentication and session management
- `@core-utils` - Utilities, logging, rate limiting
- `@core-audit` - Audit logging for compliance
- `@core-analytics` - Usage tracking
- `@core-billing` - Subscription management

## 📦 Project Structure

```
vorklee2/
├── apps/
│   ├── core/              # Core platform app
│   │   ├── app/           # Next.js app directory
│   │   ├── db/            # Database schema and client
│   │   ├── services/      # Business logic
│   │   └── package.json
│   │
│   └── notes/             # Notes app
│       ├── app/           # Next.js app directory
│       ├── db/            # Database schema
│       ├── services/      # Business logic
│       ├── lib/           # Validations and utilities
│       ├── contexts/      # React contexts
│       └── package.json
│
├── packages/
│   ├── core-auth/         # Authentication package
│   ├── core-utils/        # Utilities package
│   ├── core-audit/        # Audit logging package
│   ├── core-analytics/    # Analytics package
│   └── core-billing/      # Billing package
│
├── turbo.json             # Turborepo configuration
├── package.json           # Root package.json
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL (or NeonDB account)
- Redis (optional, for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sunsewingmachine/vorklee2.git
   cd vorklee2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   **Core Platform** (`apps/core/.env.local`):
   ```env
   DATABASE_URL_CORE=postgresql://user:password@host/core
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key-change-in-production
   NEXT_PUBLIC_PLATFORM_URL=http://localhost:3000
   ```

   **Notes App** (`apps/notes/.env.local`):
   ```env
   DATABASE_URL_NOTES=postgresql://user:password@host/notes
   REDIS_URL=redis://localhost:6379
   CORE_API_URL=http://localhost:3000/api/core
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

4. **Push database schemas**
   ```bash
   # Core platform
   cd apps/core
   npm run db:push
   
   # Notes app
   cd ../notes
   npm run db:push
   ```

5. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   
   # Or individually:
   # Core: npm run dev --filter=core
   # Notes: npm run dev --filter=notes
   ```

6. **Access the apps**
   - Core Platform: http://localhost:3000
   - Notes App: http://localhost:3001

## 📚 Documentation

### Core Concepts

#### Authentication Flow
1. User logs in via Core Platform (`/api/auth/login`)
2. Core issues JWT token with `{ userId, orgId, email, role }`
3. Token stored in httpOnly cookie
4. Apps verify token using `@core-auth` package
5. All API routes protected by middleware

#### Organization Isolation
- All data scoped by `organizationId`
- Row-level security enforced in services
- No cross-organization data access

#### Subscription Management
- Plans: Free, Pro, Business, Enterprise
- Features gated by plan tier
- Checked via `@core-billing` package

### Development Guidelines

#### Creating a New App

1. Create app directory: `apps/your-app/`
2. Copy structure from `apps/notes/`
3. Update `package.json` with dependencies
4. Create database schema in `db/schema.ts`
5. Add to Turborepo configuration
6. Create Neon branch: `your-app-db`

#### Code Standards

- **TypeScript only** - no JavaScript files
- **ESLint + Prettier** - automatic formatting
- **Named exports** - except page components
- **Error handling** - always include original error message
- **Validation** - use Zod schemas for all inputs
- **Authentication** - use `getUserAuth()` from `@core-auth`

## 🔒 Security

### Best Practices Implemented

- ✅ JWT-based authentication with httpOnly cookies
- ✅ Rate limiting on all API routes
- ✅ Input validation with Zod
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection (React + Next.js)
- ✅ CSRF protection (SameSite cookies)
- ✅ Row-level access control by organization
- ✅ Audit logging for all mutations

### Security Checklist

- [ ] Rotate JWT secrets regularly
- [ ] Enable SSL/TLS in production
- [ ] Use secure environment variables
- [ ] Monitor audit logs
- [ ] Set up rate limiting with Redis
- [ ] Enable CORS with whitelist
- [ ] Implement 2FA (future)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific app
npm run test --filter=notes

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Neon Database Setup

1. Create Neon project: `vorklee2`
2. Create branches:
   - `core-db` for Core Platform
   - `notes-db` for Notes App
3. Get connection strings from Neon dashboard
4. Update `.env.local` files

### Vercel Deployment

1. Connect GitHub repository
2. Configure environment variables
3. Deploy Core Platform first
4. Deploy Notes App
5. Configure custom domains (optional)

### Production Checklist

- [ ] Set up production database (Neon)
- [ ] Configure Redis (Upstash or self-hosted)
- [ ] Set environment variables in Vercel
- [ ] Enable monitoring (Sentry)
- [ ] Set up analytics (PostHog)
- [ ] Configure custom domains
- [ ] Enable automatic backups
- [ ] Set up CI/CD pipeline

## 📊 Monitoring

- **Errors**: Sentry integration
- **Analytics**: PostHog / Vercel Analytics
- **Uptime**: UptimeRobot
- **Database**: Neon metrics dashboard

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- [Neon Database Setup Guide](./docs/NEON_SETUP.md)
- [Notes App Documentation](./apps/notes/README.md)
- [API Documentation](./docs/API.md)
- [Architecture Blueprint](./AppSpecV3/)

## 📞 Support

For support, email: support@vorklee2.com

---

**Built with ❤️ following enterprise standards and best practices**


