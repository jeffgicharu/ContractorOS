<div align="center">

<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Next.js_15-000000?logo=next.js&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/NestJS_11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
<img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" />

# ContractorOS

**Unified contractor lifecycle platform — onboarding, invoicing, classification risk monitoring, compliance documents, and offboarding.**

Built for operations leads, finance teams, and HR admins at companies managing 20–200 contractors.

[Live Demo](https://contractoros.jeffgicharu.com) &middot; [Getting Started](#getting-started) &middot; [Architecture](#architecture)

</div>

---

<div align="center">
<img src="docs/demo.gif" alt="ContractorOS Demo" width="900" />
</div>

---

## The Problem

Contractor management is duct-taped across 3–5 disconnected tools. Onboarding checklists live in spreadsheets, invoices pile up in email, W-9s go missing until the 1099 filing deadline, and 83% of former contractors still have system access after leaving. Meanwhile, misclassification penalties run $10,000–$25,000 per worker in high-enforcement states, and no existing tool monitors risk continuously.

ContractorOS replaces that patchwork with a single platform that handles the full contractor lifecycle — from the first invite to the final access revocation.

## Key Features

- **Onboarding Pipeline** — Kanban board tracking contractors through invite, tax forms, contract signing, and bank details. Bulk invites and automated step progression.

- **Classification Risk Monitor** — Continuous scoring against three legal tests (IRS common-law, DOL economic realities, California ABC). Weighted risk aggregation with drill-down into individual factors. Daily automated re-assessment via CRON.

- **Invoice Workflow Engine** — Full state machine: Draft → Submitted → Under Review → Approved → Scheduled → Paid. Multi-level approval routing, duplicate detection, and complete status history.

- **Compliance Document Vault** — Centralized storage for W-9s, W-8BENs, contracts, NDAs, and insurance certificates. Version tracking, expiration alerts, and 1099 readiness reporting.

- **Offboarding Automation** — Auto-generated 9-item checklist covering access revocation, equipment return, final invoicing, and knowledge transfer. Post-termination invoice blocking.

- **Contractor Self-Service Portal** — Contractors submit invoices, upload documents, track payment status, and manage their profile through a dedicated portal.

- **Audit Log** — Immutable append-only log of every state-changing operation, with old/new value capture and filterable query interface.

- **Notifications** — Real-time notification system with 11 event types triggered across invoices, classification alerts, offboarding, and document expiry.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Backend | NestJS 11, raw SQL via `pg` driver (no ORM) |
| Database | PostgreSQL 16 |
| Validation | Zod schemas (shared between frontend and backend) |
| Testing | Jest (362 unit tests), Cypress (26 E2E tests), Storybook (45+ stories) |
| CI/CD | GitHub Actions (lint, type-check, unit, integration, E2E) |
| Build | Turborepo, pnpm workspaces |

## Architecture

```
apps/
  api/          NestJS backend — REST API, auth, business logic, raw SQL
  web/          Next.js frontend — admin dashboard, contractor portal

packages/
  shared/       TypeScript types, Zod schemas, constants, state machines
```

The backend uses raw parameterized SQL queries — no ORMs. Every ID is a UUID, every timestamp is `TIMESTAMPTZ`, and every state transition is enforced by explicit state machines in the shared package.

<details>
<summary><strong>Database Schema (21 tables)</strong></summary>

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root |
| `users` | All authenticated users (admin, manager, contractor) |
| `contractors` | Core entity with 7-status lifecycle |
| `contractor_status_history` | Temporal status tracking |
| `onboarding_steps` | 4-stage onboarding pipeline |
| `engagements` | Scopes of work with hourly/fixed rates |
| `time_entries` | Hours logged against engagements |
| `invoices` | 8-status invoice lifecycle |
| `invoice_line_items` | Individual billable items |
| `invoice_status_history` | Invoice transition audit trail |
| `approval_steps` | Multi-level approval chain |
| `tax_documents` | 6 document types with version tracking |
| `classification_assessments` | Risk scores across 3 legal tests |
| `classification_factors` | Raw engagement data for scoring |
| `offboarding_workflows` | 5-status offboarding process |
| `offboarding_checklist_items` | 9-item auto-generated checklist |
| `equipment` | Company-issued device tracking |
| `audit_events` | Immutable append-only audit log |
| `notifications` | 11 notification types |
| `refresh_tokens` | JWT refresh token rotation |
| `mv_classification_risk_summary` | Materialized view for dashboard |

</details>

<details>
<summary><strong>API Routes (59 endpoints)</strong></summary>

All routes are prefixed with `/api/v1`.

**Auth** — Login, logout, refresh, invite accept, password reset (7 endpoints)

**Contractors** — CRUD, bulk invite, onboarding pipeline, tax summary (9 endpoints)

**Engagements** — CRUD with status transitions (5 endpoints)

**Time Entries** — CRUD with engagement validation (5 endpoints)

**Invoices** — Full lifecycle with state machine actions: submit, approve, reject, dispute, schedule, mark-paid, cancel (12 endpoints)

**Documents** — Upload, download, soft-delete, compliance report, 1099 readiness (7 endpoints)

**Classification** — Risk assessment, history, manual re-score, dashboard, factor management (6 endpoints)

**Offboarding** — Initiate, checklist management, workflow updates (5 endpoints)

**Audit Log** — Filterable query with entity type, action, and date range (1 endpoint)

**Notifications** — List, mark read, mark all read (3 endpoints)

</details>

## Getting Started

### Prerequisites

- **Node.js** 22+
- **pnpm** 10.28+
- **PostgreSQL** 16

### Installation

```bash
# Clone the repository
git clone https://github.com/jeffgicharu/contractor-os.git
cd contractor-os

# Install dependencies
pnpm install
```

### Environment Setup

```bash
# API environment
cp apps/api/.env.example apps/api/.env

# Web environment
cp apps/web/.env.example apps/web/.env
```

The defaults work for local development. Key variables:

```env
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contractor_os
JWT_SECRET=your-jwt-secret-change-in-production
PORT=3001
CORS_ORIGIN=http://localhost:3000

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Database Setup

```bash
# Create the database
createdb contractor_os

# Run migrations (9 migration files covering all tables + indexes)
pnpm --filter @contractor-os/api migrate:up

# Seed with demo data (55+ contractors, 130+ invoices, 340+ time entries)
pnpm --filter @contractor-os/api seed
```

### Run

```bash
# Start both API and frontend in development mode
pnpm dev
```

The API runs on `http://localhost:3001` and the frontend on `http://localhost:3000`.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@acme-corp.com` | `Password1` |
| Contractor | `john.smith@example.com` | `Password1` |

## Testing

```bash
# Unit tests (362 tests)
pnpm test

# Integration tests (real PostgreSQL)
pnpm test:integration

# E2E tests (Cypress — 5 suites, 26 tests)
pnpm --filter @contractor-os/web cypress:run

# Component stories
pnpm --filter @contractor-os/web storybook
```

## Project Structure

```
apps/api/src/
  auth/               JWT auth with refresh token rotation
  contractors/        Contractor CRUD + onboarding pipeline
  engagements/        Engagement management + status transitions
  time-entries/       Time tracking with engagement validation
  invoices/           Invoice lifecycle + approval routing
  documents/          Document vault + compliance reporting
  classification/     Risk scoring (IRS, DOL, ABC tests) + CRON
  offboarding/        Offboarding workflows + checklist generation
  audit/              Immutable audit log with diff capture
  notifications/      Event-driven notification system
  database/
    migrations/       9 versioned migrations (node-pg-migrate)
    seeds/            Demo data generator

apps/web/src/
  app/
    (auth)/           Login, invite accept pages
    (admin)/          Admin dashboard, all management pages
    (portal)/         Contractor self-service portal
  components/
    layout/           Sidebar, header, portal navigation
    ui/               Shared primitives (button, input, modal, badge)
    invoices/         Invoice-specific components
    contractors/      Contractor-specific components
    offboarding/      Offboarding-specific components
  hooks/              use-auth, use-api, use-contractors, etc.
  lib/                API client, utilities

packages/shared/src/
  types/              TypeScript interfaces for all entities
  schemas/            Zod validation schemas
  constants/          State machines, enums, status transitions
```
</div>
