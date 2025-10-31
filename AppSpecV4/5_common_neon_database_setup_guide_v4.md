---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🗄️ 05_Common_Neon_Database_Setup_Guide.md  
## Vorklee2 Neon Database Setup Guide — Multi-Branch Architecture (v4.0)

---

## 🧭 Purpose

This guide defines the **official Neon Database setup and management standards** for the Vorklee2 Hybrid Multi-App SaaS Platform.  
It ensures clean isolation between the **Core Platform** and each **App Module** (e.g., Notes, Attendance, HR), while maintaining shared analytics and authentication.

---

## 🧱 1. Objective

Set up one Neon project (`vorklee2`) with **dedicated branches** for:
- Core Platform (`core-db`)
- Notes App (`notes-db`)
- Attendance App (`attendance-db`)
- HR App (`hr-db`, optional/future)

Each branch serves as an **independent database** with shared authentication and monitoring.

---

## 🧩 2. Final Branch Structure

```
🏢 Neon Project: vorklee2
│
├── 🌐 Branch: core-db
│     └── Database: core
│     └── Tables: organizations, users, subscriptions, analytics
│
├── 🧠 Branch: notes-db
│     └── Database: notes
│     └── Tables: notes, notebooks, tags, attachments
│
├── 🕒 Branch: attendance-db
│     └── Database: attendance
│     └── Tables: logs, shifts, app_users
│
└── 👥 Branch: hr-db
      └── Database: hr
      └── Tables: employees, leaves, payroll
```

---

## ⚙️ 3. Creating a Neon Project (UI Method)

1. Visit [https://neon.tech](https://neon.tech) and sign in.  
2. Create a new project named **`vorklee2`**.  
3. Choose a region closest to your primary customer base.  
4. Wait for Neon to provision your default branch and database.

---

## 🧰 4. Creating Branches (UI or CLI)

### Option 1: Web Dashboard
1. Open your project → **“Branches” → “Create Branch.”**  
2. Create the following branches:
   - `core-db`
   - `notes-db`
   - `attendance-db`
   - `hr-db` (optional)  
3. Within each branch, create a matching database:
   ```sql
   CREATE DATABASE core;
   CREATE DATABASE notes;
   CREATE DATABASE attendance;
   CREATE DATABASE hr;
   ```

### Option 2: CLI Method
```bash
# Install CLI
npm install -g neonctl

# Login and create project
neonctl login
neonctl projects create vorklee2

# Create branches
neonctl branches create --project vorklee2 core-db
neonctl branches create --project vorklee2 notes-db
neonctl branches create --project vorklee2 attendance-db
neonctl branches create --project vorklee2 hr-db

# Create databases
neonctl sql exec --project vorklee2 --branch core-db --command "CREATE DATABASE core;"
neonctl sql exec --project vorklee2 --branch notes-db --command "CREATE DATABASE notes;"
neonctl sql exec --project vorklee2 --branch attendance-db --command "CREATE DATABASE attendance;"
neonctl sql exec --project vorklee2 --branch hr-db --command "CREATE DATABASE hr;"
```

---

## 🔗 5. Connection URLs

Each branch provides a **unique connection string**. Example:

```
DATABASE_URL_CORE=postgresql://user:pass@vorklee2-core-db.neon.tech/core
DATABASE_URL_NOTES=postgresql://user:pass@vorklee2-notes-db.neon.tech/notes
DATABASE_URL_ATTENDANCE=postgresql://user:pass@vorklee2-attendance-db.neon.tech/attendance
DATABASE_URL_HR=postgresql://user:pass@vorklee2-hr-db.neon.tech/hr
```

Use these in each app’s `.env.local` file.

---

## 🧮 6. Example .env Files

### Core Platform
```bash
DATABASE_URL_CORE=postgresql://user:pass@vorklee2-core-db.neon.tech/core
STRIPE_SECRET=sk_live_...
REDIS_URL=redis://user:pass@host:port
JWT_SECRET=supersecret
NEXT_PUBLIC_PLATFORM_URL=https://vorklee2.com
```

### Notes App
```bash
DATABASE_URL_NOTES=postgresql://user:pass@vorklee2-notes-db.neon.tech/notes
CORE_API_URL=https://vorklee2.com/api/core
NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com
REDIS_URL=redis://user:pass@host:port
```

### Attendance App
```bash
DATABASE_URL_ATTENDANCE=postgresql://user:pass@vorklee2-attendance-db.neon.tech/attendance
CORE_API_URL=https://vorklee2.com/api/core
NEXT_PUBLIC_APP_URL=https://attendance.vorklee2.com
```

---

## 🧠 7. Drizzle ORM Configuration

Each app connects using its dedicated branch:

```ts
// apps/notes/db/db.ts
import { drizzle } from "drizzle-orm/neon-http";
const db = drizzle(process.env.DATABASE_URL_NOTES!);
export default db;
```

```ts
// packages/core-db/db.ts
import { drizzle } from "drizzle-orm/neon-http";
const db = drizzle(process.env.DATABASE_URL_CORE!);
export default db;
```

---

## 💾 8. Backup and PITR Strategy

Neon automatically enables **Point-in-Time Recovery (PITR)** for each branch.  
For manual snapshots:

### Manual Backup via UI
1. Navigate to branch → **Settings → Backups.**  
2. Click **“Create Backup Snapshot.”**  
3. Optionally export to S3 or download.

### CLI Automation
```bash
neonctl backups create --project vorklee2 --branch notes-db
```

**Recommended Policy:**
| Branch | Frequency | Retention |
|---------|------------|------------|
| Core | Every 6 hours | 30 days |
| Apps | Daily | 15 days |

---

## 🧾 9. Security & Access Controls

- Rotate DB passwords every 90 days.  
- Restrict connections to app servers (Neon IP allowlist).  
- Use CI/CD secrets for connection URLs.  
- Log all DB writes via `@core-audit`.  
- Enforce org-based row isolation in every table.

---

## ⚡ 10. Performance Optimization

| Optimization | Recommendation |
|---------------|----------------|
| Connection pooling | Enable Neon pooling |
| Query optimization | Use Drizzle ORM indexes |
| Read load | Use read replicas for analytics |
| Cache layer | Use Redis for frequent reads |
| Query logging | Enable Neon Insights |
| Monitoring | Neon Metrics + Grafana integration |

---

## 🔁 11. Automation Script Example

A simple reusable shell script for app onboarding:

```bash
#!/bin/bash
APP=$1
echo "Creating Neon branch for: $APP"
neonctl branches create --project vorklee2 ${APP}-db
neonctl sql exec --project vorklee2 --branch ${APP}-db --command "CREATE DATABASE ${APP};"
echo "Branch ${APP}-db created successfully."
```

Add this script to your CI/CD pipeline for automated app provisioning.

---

## 🌍 12. Multi-Region Setup (Enterprise)

For large-scale deployments, maintain separate projects per region:

```
vorklee2-us
 ├─ core-db
 ├─ notes-db
 └─ attendance-db

vorklee2-eu
 ├─ core-db
 ├─ notes-db
 └─ attendance-db
```

Sync analytics to a **Global BI database** for unified reporting.

---

## ✅ Summary

| Layer | Entity | Notes |
|--------|--------|-------|
| Core Platform | `core-db` | Auth, billing, orgs |
| Notes App | `notes-db` | Independent schema |
| Attendance App | `attendance-db` | Independent schema |
| HR App | `hr-db` | Optional, future module |

**One Neon project → many branches → clean isolation + shared core.**

---

**End of File — Vorklee2 Neon Database Setup Guide (v4.0)**
