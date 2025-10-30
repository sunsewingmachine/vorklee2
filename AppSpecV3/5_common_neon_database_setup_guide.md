### Index: 5 of 5 — Vorklee2 Neon Database Setup Guide
# 🗄️ Vorklee2 Neon Database Setup Guide v2 – Core + App Branch Architecture

This document provides **step-by-step setup instructions** for configuring the Neon PostgreSQL environment for the **Vorklee2 Multi-App SaaS Platform**.  
It supports both **Dashboard (UI)** and **CLI** methods, matching the hybrid architecture defined in files 1–4.

---

## 1️⃣ Objective

Create and configure the Neon environment for:
- Shared **Core Platform DB** (organizations, billing, users)
- Dedicated **App DBs** for Notes, Attendance, HR, etc.
- Isolated connections with shared authentication and backups

---

## 2️⃣ Final Structure Overview (Diagram)

```
🏢 Neon Project: vorklee2
│
├── 🌐 Branch: core-db
│     └── Database: core
│     └── Tables: organizations, global_users, subscriptions, analytics
│
├── 🧠 Branch: notes-db
│     └── Database: notes
│     └── Tables: app_users, notes, notebooks, tags, attachments
│
├── 🕒 Branch: attendance-db
│     └── Database: attendance
│     └── Tables: app_users, attendance_logs, shifts
│
└── 👥 Branch: hr-db (optional, future)
      └── Database: hr
      └── Tables: employees, leaves, payroll
```

Each branch acts as an **independent database** within one Neon project.

---

## 3️⃣ Create Neon Project (UI Method)

1. Go to [https://neon.tech](https://neon.tech) and **sign in**.  
2. Click **“New Project” → Name it `vorklee2`**.  
3. Choose your region closest to your user base (e.g., `US East`, `EU Central`).  
4. Wait for Neon to create the default branch (`main`) and database (`neondb`).

---

## 4️⃣ Create Database Branches (UI)

From the `vorklee2` dashboard:
1. Click **“Branches”** in the left menu.  
2. Click **“Create Branch”** → name it `core-db`.  
3. Repeat for each app:
   - `notes-db`
   - `attendance-db`
   - `hr-db` (optional, for future use)
4. For each branch:
   - Open it, click **“SQL Editor”**
   - Run:
     ```sql
     CREATE DATABASE core;
     CREATE DATABASE notes;
     CREATE DATABASE attendance;
     CREATE DATABASE hr;
     ```

Each branch now has its own dedicated database.

---

## 5️⃣ Create Database Branches (CLI Method)

If you prefer command-line automation:

### Step 1 — Install Neon CLI
```bash
npm install -g neonctl
```

### Step 2 — Login
```bash
neonctl login
```

### Step 3 — Create Project
```bash
neonctl projects create vorklee2
```

### Step 4 — Create Branches
```bash
neonctl branches create --project vorklee2 core-db
neonctl branches create --project vorklee2 notes-db
neonctl branches create --project vorklee2 attendance-db
neonctl branches create --project vorklee2 hr-db
```

### Step 5 — Create Databases
```bash
neonctl sql exec --project vorklee2 --branch core-db --command "CREATE DATABASE core;"
neonctl sql exec --project vorklee2 --branch notes-db --command "CREATE DATABASE notes;"
neonctl sql exec --project vorklee2 --branch attendance-db --command "CREATE DATABASE attendance;"
neonctl sql exec --project vorklee2 --branch hr-db --command "CREATE DATABASE hr;"
```

---

## 6️⃣ Get Connection URLs

For each branch, Neon provides a unique connection string.  
Go to **“Connection Details”** in each branch panel.

Example URLs:
```
DATABASE_URL_CORE=postgresql://user:password@vorklee2-core-db.neon.tech/core
DATABASE_URL_NOTES=postgresql://user:password@vorklee2-notes-db.neon.tech/notes
DATABASE_URL_ATTENDANCE=postgresql://user:password@vorklee2-attendance-db.neon.tech/attendance
DATABASE_URL_HR=postgresql://user:password@vorklee2-hr-db.neon.tech/hr
```

Use these values in your app `.env` files.

---

## 7️⃣ .env File Setup (for Each App)

### Core Platform
```
DATABASE_URL_CORE=postgresql://user:pass@vorklee2-core-db.neon.tech/core
STRIPE_SECRET=sk_live_...
REDIS_URL=redis://user:pass@host:port
JWT_SECRET=supersecret
NEXT_PUBLIC_PLATFORM_URL=https://vorklee2.com
```

### Notes App
```
DATABASE_URL_NOTES=postgresql://user:pass@vorklee2-notes-db.neon.tech/notes
CORE_API_URL=https://vorklee2.com/api/core
NEXT_PUBLIC_APP_URL=https://notes.vorklee2.com
REDIS_URL=redis://user:pass@host:port
```

### Attendance App
```
DATABASE_URL_ATTENDANCE=postgresql://user:pass@vorklee2-attendance-db.neon.tech/attendance
CORE_API_URL=https://vorklee2.com/api/core
NEXT_PUBLIC_APP_URL=https://attendance.vorklee2.com
```

---

## 8️⃣ Connect Using Drizzle ORM

Each app should have its own database client.

### Example: Notes App
```ts
// apps/notes/db/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
const db = drizzle(process.env.DATABASE_URL_NOTES!);
export default db;
```

### Example: Core Platform
```ts
// packages/core-db/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
const db = drizzle(process.env.DATABASE_URL_CORE!);
export default db;
```

---

## 9️⃣ Backups and PITR

Neon automatically enables **Point-in-Time Recovery (PITR)** per branch.  
For manual backup:

1. Go to each branch → **Settings → Backups**  
2. Click **“Create Backup Snapshot”**  
3. Optionally export to S3 or download locally.

You can also automate via CLI:
```bash
neonctl backups create --branch notes-db --project vorklee2
```

---

## 🔟 Performance and Scaling Tips

| Task | Recommendation |
|------|----------------|
| Connection pooling | Enable built-in Neon pooling for all apps |
| Query load | Use read replicas for analytics-heavy branches |
| App isolation | Each app connects only to its DB branch |
| Caching | Use Redis for high-frequency read ops |
| Monitoring | Enable Neon metrics in dashboard |
| Backup frequency | Daily for apps, every 6h for core |

---

## 1️⃣1️⃣ Security Recommendations

- Rotate passwords and credentials every 90 days  
- Store `.env` securely using GitHub secrets or Vercel env vars  
- Enable Neon IP allowlist (restrict access to app servers only)  
- Audit DB usage through `@core-audit` events

---

## 1️⃣2️⃣ Branch Naming and Management Policy

| Purpose | Branch | Frequency | Notes |
|----------|---------|------------|-------|
| Core Platform | `core-db` | Persistent | Never delete |
| Notes App | `notes-db` | Persistent | Backup daily |
| Attendance App | `attendance-db` | Persistent | Backup daily |
| HR App | `hr-db` | Optional | For future product |
| Development | `dev-*` | Ephemeral | Auto-delete after merge |

---

## 1️⃣3️⃣ Example Automation Script (for CI/CD)

```bash
#!/bin/bash
# Create Neon branches automatically via CLI for new apps

APP=$1
echo "Creating Neon branch for app: $APP"

neonctl branches create --project vorklee2 ${APP}-db
neonctl sql exec --project vorklee2 --branch ${APP}-db --command "CREATE DATABASE ${APP};"

echo "Branch ${APP}-db and database ${APP} created successfully."
```

---

## 1️⃣4️⃣ Multi-Region Setup (Future Enterprise)

For global clients, create separate Neon projects per region:

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

Each region syncs analytics to a **central global reporting DB**.

---

## ✅ Summary

| Layer | Neon Entity | Notes |
|--------|--------------|-------|
| Core Platform | `core-db` | Shared authentication, billing |
| Notes App | `notes-db` | Independent DB, integrated via Core |
| Attendance App | `attendance-db` | Independent DB |
| HR App | `hr-db` | Optional future branch |

**You only need ONE Neon project (`vorklee2`) with multiple branches.**  
Each branch = one app DB = clean isolation + shared ecosystem.

---

**End of File – 5_vorklee2_neon_database_setup_guide.md**
