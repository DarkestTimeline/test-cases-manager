# QA Test Case Manager

A full-stack manual QA test case management application built to let multiple testers run the same test suite concurrently without overwriting each other's data. Built from scratch as a hands-on learning project in full-stack web development.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Key Design Decisions](#key-design-decisions)
- [Roadmap](#roadmap)

---

## Overview

QA Test Case Manager is a Next.js application for organizing manual QA test cases into modules and suites, running test suites against a snapshot of your test data, and tracking results over time through a reporting dashboard. It supports CSV import/export, drag-and-drop reordering, soft delete/archive for all primary resources, and role-based authenticated access via Supabase.

Built as a self-directed learning project to get hands-on with full-stack development — data modeling, the Server/Client Component boundary, and Row Level Security in particular.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | [Next.js](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security) |
| Auth integration | `@supabase/ssr` |
| Drag & drop | [`@dnd-kit`](https://dndkit.com/) |
| CSV import/export | [PapaParse](https://www.papaparse.com/) |
| Charts & reporting | [Recharts](https://recharts.org/) |
| Hosting / CI-CD | [Vercel](https://vercel.com/) |
| Scheduled jobs | Vercel Cron |

No ORM is used — the app talks to Postgres directly through the Supabase JS client, with authorization enforced at the database layer via Row Level Security (RLS) rather than solely in application code.

## Architecture

- **Next.js App Router** with a mix of Server and Client Components. Data fetching for initial page loads happens in Server Components; interactive pieces (forms, drag-and-drop lists, run execution UI) are Client Components.
- **Supabase Auth** handles user sign-up/sign-in via `@supabase/ssr`, with middleware-based route protection so unauthenticated requests never reach protected pages. Sign-up is gated behind an invite code, and a demo account is available for evaluation without creating a real account.
- **Row Level Security** is enabled on every table. Policies are built around `auth.uid() is not null` — any authenticated user can read/write shared QA data, since this is a collaborative team tool rather than a per-user data silo.
- **Snapshot pattern**: `test_runs` and `run_results` do not live-reference `test_cases`/`suites` for display purposes. At run creation, the current suite composition and test case content are copied into `run_results`, including a frozen human-readable ID and the tester's display name at that point in time.
- **Human-readable IDs**: `test_cases`, `suites`, and `modules` each get a stable, human-friendly code (e.g. `TC-01`, `S-01`, `M-01`) generated via Postgres identity columns, which are what actually get snapshotted into run results (rather than internal UUIDs) for readability in reports.
- **Soft delete**: every primary resource (test cases, suites, modules) supports archive/restore instead of hard deletion, so historical run data referencing them is never orphaned.
- **Keep-alive job**: a Vercel Cron job (`vercel.json` + `src/app/api/keep-alive/route.js`) pings the database once a day to prevent the Supabase free-tier project from auto-pausing due to inactivity. The endpoint is protected by a `CRON_SECRET` header check and uses the Supabase service role key server-side only.

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profile data (display name, role), auto-created via a trigger on new auth signups |
| `modules` | Top-level groupings of test cases |
| `test_cases` | Individual manual test cases, human-readable ID (`TC-##`), supports archive |
| `module_cases` | Join table linking test cases to modules, preserves ordering |
| `suites` | Collections of test cases assembled for execution, human-readable ID (`S-##`), supports archive |
| `suite_cases` | Join table linking test cases to suites, preserves ordering |
| `test_runs` | A single execution instance of a suite; captures who ran it and when |
| `run_results` | Snapshot of each test case's state, position, code, and tester identity at run-start; holds the Pass/Fail/Blocked/Skipped/Pending outcome per case |

**Status fields are stored as plain text**, not Postgres enums, so new statuses (e.g. adding a `Cancelled` run status) can be introduced without a schema migration.

## Features

- **Test case, suite, and module CRUD** with drag-and-drop reordering (`@dnd-kit`)
- **Test run engine**: start a run from a suite, execute each case with a Pass/Fail/Blocked/Skipped/Pending status, tester identity frozen at run-start for historical accuracy
- **Runs dashboard**: filter by status, suite, and tester; search; date range filtering; pagination; cancelled runs tracked as a distinct status
- **Soft delete / archive & restore** across all primary resources
- **CSV import/export** with validation and module assignment (PapaParse)
- **Reporting dashboard**: pass rate trends, run activity over time, and suite-level breakdowns (Recharts)
- **Settings**: dedicated Import/Export tabs
- **Invite-code-gated signup** plus a demo account for trying the app without registering
- **Role-based profiles** with an auto-creation trigger tying each Supabase Auth user to a `profiles` row
- **Keep-alive cron job** to prevent the free-tier Supabase project from pausing

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── keep-alive/route.js   # Vercel Cron endpoint, pings DB daily
│   │   ├── (auth routes)             # Sign in / sign up / invite-code gate
│   │   ├── modules/                  # Module CRUD + case assignment
│   │   ├── suites/                   # Suite CRUD + case assignment
│   │   ├── test-cases/               # Test case CRUD
│   │   ├── runs/                     # Run execution + runs dashboard
│   │   ├── reports/                  # Reporting dashboard (Recharts)
│   │   └── settings/                 # Import/Export tabs
│   ├── components/                   # Shared Button, Badge, Card, etc.
│   ├── lib/
│   │   ├── supabase/                 # Supabase client setup (browser + server)
│   │   └── badgeStyles.js            # Shared status → badge style mapping
│   └── middleware.js                 # Route protection for authenticated pages
├── vercel.json                       # Cron schedule config
└── package.json
```

*(Adjust the tree above to match your actual folder names if they differ — this reflects the structure as built.)*

## Getting Started

### Prerequisites

- Node.js (LTS)
- A Supabase project (Postgres + Auth enabled)
- A Vercel account (for deployment and Cron)

### Local Setup

```powershell
git clone <your-repo-url>
cd <project-folder>
npm install
```

Create a `.env.local` file (see [Environment Variables](#environment-variables) below), then run:

```powershell
npm run dev
```

The app will be available at `http://localhost:3000`.

### Database Setup

1. Create a new Supabase project.
2. Run the schema SQL to create `profiles`, `modules`, `test_cases`, `module_cases`, `suites`, `suite_cases`, `test_runs`, and `run_results`, along with their RLS policies.
3. Set up the trigger that auto-creates a `profiles` row on new Supabase Auth signups.
4. Configure the invite-code check used to gate signups.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (used client-side, protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, server-side only — used by the keep-alive cron route |
| `CRON_SECRET` | Shared secret checked against the header on incoming cron requests |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client — it bypasses RLS.

## Deployment

The app is deployed on Vercel. Pushing to the main branch triggers a new deployment. The Vercel Cron job defined in `vercel.json` calls `/api/keep-alive` daily at 6:00 UTC to keep the Supabase free-tier project from pausing due to inactivity.

## Key Design Decisions

- **Snapshot everything at run-start** — live references to test cases would break historical accuracy once source data changes; `run_results` freezes the test case code, position, and tester identity as of the moment a run begins.
- **Plain text over Postgres enums for status fields** — easier to extend with new statuses without a migration.
- **Soft delete over hard delete** for all primary resources, so archived data can't orphan historical run references.
- **"Select all" as a frozen bulk copy** when adding a module's cases to a suite, rather than a live link.
- **Simplicity over premature complexity** — features like bulk test case creation and mid-run quick-add were designed, then deliberately reversed after deciding they added complexity without real benefit.
- **Provider isolation for any future LLM integration** — planned AI features wrap model calls behind a single function (e.g. `generateTestCases(docText)`) so swapping providers later is low-risk.
