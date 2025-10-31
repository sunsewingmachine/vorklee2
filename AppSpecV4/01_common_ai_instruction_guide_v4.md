---
version: "4.0"
maintainer: "Vorklee2 DevOps / AI Systems Team"
last_updated: "auto"
type: "core"
framework: "Next.js 14+"
database: "NeonDB"
---

# 🧠 01_Common_AI_Instruction_Guide.md  
## Vorklee2 Hybrid Multi-App SaaS Platform  
### — Master AI Instruction & Orchestration File (v4.0)

---

## 🧩 Purpose

This document defines **how all AI systems, generators, and automation agents** within the Vorklee2 ecosystem must reason, interpret, and construct solutions across the **multi-app SaaS platform**.

It ensures that AI-assisted logic remains:
- **Consistent** across apps and shared packages  
- **Secure** with enforced modular boundaries  
- **Scalable** in line with Next.js + Turborepo + Neon architecture  
- **Traceable** with contextual metadata  

---

## 🚀 1. Core AI Reasoning Principles

| Principle | Description |
|------------|--------------|
| **Modular Reasoning** | Treat each app (Notes, Attendance, HR, Catalog, etc.) as an independent module connected through Core APIs. No cross-database or direct dependency is allowed. |
| **Context Awareness** | Always respect the app context. Example: Notes App logic must never call or reference Attendance DB. |
| **Scalable Design** | Recommend horizontally scalable, multi-tenant, org-based solutions only. |
| **Traceability** | Every AI-generated file or code must include a short comment like:<br>`// AI: Generated for Notes App (v4.0)` |
| **Human Validation First** | Output must be human-readable and review-ready before automation or deployment. |

---

## 🧱 2. System Context and Environment

The Vorklee2 architecture follows a **hybrid modular model**:

- **Frontend:** Next.js 14+ (App Router)
- **Backend:** Edge + Server Actions with NeonDB (PostgreSQL)
- **Infra:** Turborepo, Docker, GitHub Actions
- **Packages:** Shared logic via `/packages/core-*`
- **Apps:** Located under `/apps/` — each maintains its own Neon branch and DB schema.

AI tools must always adhere to this ecosystem when generating code or documentation.

---

## 🧩 3. Modular Dashboard Awareness

AI reasoning must understand the **Modular Dashboard Architecture** — the system that builds menus and settings dynamically based on purchased modules.

### Rules for AI Outputs
1. **Global Menus** (always visible): Users, Settings, Logout, Help.  
2. **Dynamic Menus:** Only include modules purchased by the client.  
3. **Settings Tabs:** Add default tabs (`Language`, `Currency`, `Time Zone`, `Theme`) + module tabs (e.g., “Notes Preferences”).  
4. **Entitlement Control:** Never assume module access — rely on backend authorization.  
5. **Lazy Loading:** Suggest dynamic imports and micro-frontend design when generating code.  

---

## 🤖 4. AI Behavior Directives

When generating or explaining logic, AI must:

### A. Code Generation
- Use valid import paths and correct app context.  
- Never hardcode `organizationId` or `userId`.  
- Always reference shared features through `@core-*` packages.  
- Include inline comments for AI reasoning markers (e.g., `// AI: Context = HR App`).

### B. Documentation Generation
- Follow this file order for shared docs: `01_` → `07_`.  
- Maintain uniform heading emojis, tone, and markdown hierarchy.  
- Include the YAML metadata header in every v4.0 file.

### C. Explanation Rules
- Keep terminology standardized: **Core Platform**, **App Module**, **Dashboard Shell**, **Settings Tabs**.  
- When explaining access, always reference entitlement-based visibility.  

---

## 🧠 5. AI Integration Scope

This file governs AI reasoning for:

- Code generation and refactoring  
- Documentation and architecture synthesis  
- UI layout building and auto-prototyping  
- Configuration and schema mapping  
- Multi-module orchestration reasoning  

AI systems such as ChatGPT, CursorAI, or internal Vorklee Assistants must apply these guidelines consistently across all repositories.

---

## 📊 6. Compliance & Metadata

| Property | Value |
|-----------|--------|
| Framework | Next.js 14+ (App Router) |
| Database | NeonDB (PostgreSQL) |
| Infra | Turborepo + Docker + GitHub Actions |
| Version | **4.0** |
| Maintainer | **Vorklee2 DevOps / AI Systems Team** |
| Last Updated | _(auto-sync per project)_ |

---

## ✅ Summary

The **Vorklee2 AI Instruction Guide (v4.0)** establishes the definitive standards for how AI interacts with and generates content for the multi-app SaaS ecosystem.

It ensures all AI-driven operations remain:
- Modular and isolated  
- Secure and auditable  
- Scalable and multi-tenant ready  
- Consistent across every app and shared core module

---

**End of File — Vorklee2 AI Instruction Guide (v4.0)**
