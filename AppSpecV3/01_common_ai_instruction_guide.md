🧠 01_AI_Instruction_Guide.md
Vorklee2 Hybrid Multi-App SaaS Platform
— Master AI Instruction & Orchestration File (v2.1)
🧩 Purpose

This document defines how the Vorklee2 AI assistant, code generation systems, and automation agents should interpret, construct, and manage logic across the multi-app SaaS architecture (Next.js + Turborepo + NeonDB).

It ensures consistency, predictability, and modular reasoning across core, modules, and shared packages.

🚀 1. Core AI Principles

Modular Reasoning

The AI must always treat each app (Notes, Attendance, HR, Catalog, etc.) as an independent module that connects through shared Core APIs.

Avoid cross-module dependencies except via @core-* packages.

Context-Aware Generation

When generating code, routes, or instructions, the AI must respect the current app context (e.g., Notes app logic must not reference Attendance DB).

Scalable Patterns

Always suggest architecture and code patterns that scale horizontally — multi-tenant aware, organization-based, and API-isolated.

AI Traceability

All AI-generated content must include metadata or comments referencing its context (e.g., // AI: Generated for Notes App v2.1).

Human Review First

AI content should always be structured for human readability, testing, and validation before automation or deployment.

🧱 2. System Context and Architecture

Frontend: Next.js 14+ (App Router)

Backend: Edge & Server Actions, NeonDB (Postgres)

Infra: Turborepo, Docker, GitHub Actions

Packages: Shared via /packages/core-*

Modules: Reside under /apps/ (Notes, Attendance, HR, Catalog, etc.)

Each app connects to its own Neon branch and consumes shared services for authentication, billing, and analytics.

🧩 3. Modular Dashboard Architecture

The Vorklee2 Platform implements a Modular Dashboard Architecture, allowing the UI and settings to dynamically adapt based on purchased modules.

This concept ensures scalability, maintainability, and personalization for each client organization.

🔧 Overview

Each client account has access to different purchased modules (apps), such as Notes, Attendance, Catalog, or HR.
The dashboard and settings menu automatically reflect only the modules the client owns.

🧠 AI Rules for Dashboard Generation

Global Menus (Always Present)

Users

Settings

Logout

Help (optional)

Dynamic Module Menus

Each purchased module contributes its own sidebar menus and submenus.
Example:

Client A: Notes + Attendance → only those menus appear.

Client B: Notes + HR → only Notes and HR appear.

Shared Settings Page

Default tabs: Language, Currency, Time Zone, Theme.

Each module can append additional tabs (e.g., “Notes Preferences”, “Attendance Rules”).

Backend Enforcement

The backend determines entitlements.

The frontend only displays what the backend authorizes.

Pluggable Module Registration
Each module registers:

Menu Items

Routes / Pages

Settings Tabs

API Endpoints

Dashboard Shell Responsibilities

Render sidebar, header, and content containers.

Load modules dynamically.

Maintain shared state (user, org, theme, permissions).

Provide communication hooks (context, events, APIs).

Performance & Scalability

Use lazy loading and micro-frontend techniques to load module assets on demand.

Maintain a lightweight core shell with independent module bundles.

💡 Example Module Config (/core/config/modules.ts)
export const modules = {
  notes: {
    enabled: true,
    menus: ["All Notes", "Notebooks", "Tags"],
    settingsTabs: ["Notes Preferences"],
  },
  attendance: {
    enabled: false,
    menus: ["Attendance Log", "Reports"],
    settingsTabs: ["Attendance Rules"],
  },
  catalog: {
    enabled: true,
    menus: ["Items", "Categories", "Suppliers"],
    settingsTabs: ["Catalog Settings"],
  },
};

🤖 4. AI Behavior Directives

When generating code:

Include proper import paths, matching app context.

Never hardcode organization IDs or client identifiers.

Reference shared logic only through official packages (@core-auth, @core-utils, etc.).

When updating documentation:

Follow numeric order of files (01_ to 07_) for shared system docs.

Use consistent heading styles, emoji prefixes, and markdown formatting.

When explaining or summarizing architecture:

Keep terminology consistent: “Core Platform,” “App Module,” “Dashboard Shell,” “Settings Tabs.”

Always include mention of entitlement-based visibility for modules.

🧩 5. AI Integration Context

This instruction file governs AI operations for:

Code generation

Documentation generation

UI layout suggestions

Configuration mapping

Architecture validation

AI engines (like ChatGPT or Vorklee2 internal assistants) must use these standards to produce consistent, production-grade outputs aligned with the Vorklee2 SaaS model.

📊 6. Compliance & Versioning
Property	Value
Framework	Next.js 14+ (App Router)
Database	NeonDB (Postgres)
Infra	Turborepo + Docker + GitHub Actions
Version	2.1
Maintainer	Vorklee2 DevOps / AI Systems Team
Last Updated	(auto-sync per project)
✅ Summary

This guide establishes the AI orchestration standards for Vorklee2 — defining how AI logic interacts with modular architecture, UI generation, entitlement-based menus, and backend enforcement.

The system must:

Remain modular, secure, and AI-aware.

Produce consistent, explainable, and maintainable results.

Support all multi-app SaaS workflows without tight coupling.

End of File — Vorklee2 AI Instruction Guide (v3)