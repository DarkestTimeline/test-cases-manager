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
- [License](#license)

---

## Overview

QA Test Case Manager is a Next.js application for organizing manual QA test cases into projects, modules, and suites, running test suites against a snapshot of your test data, and tracking results over time through a reporting dashboard. It supports CSV import/export, drag-and-drop reordering, soft delete/archive for all primary resources, and role-based authenticated access via Supabase.

Built as a self-directed learning project to get hands-on with full-stack development — data modeling, the Server/Client Component boundary, and Row Level Security in particular.

**Development notes:** Code was written with AI pair-programming assistance (Claude), with each feature scoped, explained, and reviewed before implementation rather than generated wholesale.

## Tech Stack

| Layer              | Technology                                                             |
| ------------------ | ---------------------------------------------------------------------- |
| Frontend framework | [Next.js](https://nextjs.org/) (App Router)                            |
| Styling            | [Tailwind CSS v4](https://tailwindcss.com/)                            |
| Database & Auth    | [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security) |
| Auth integration   | `@supabase/ssr`                                                        |
| Drag & drop        | [`@dnd-kit`](https://dndkit.com/)                                      |
| CSV import/export  | [PapaParse](https://www.papaparse.com/)                                |
| Charts & reporting | [Recharts](https://recharts.org/)                                      |
| Hosting / CI-CD    | [Vercel](https://vercel.com/)                                          |
| Scheduled jobs     | Vercel Cron                                                            |

No ORM is used — the app talks to Postgres directly through the Supabase JS client, with authorization enforced at the database layer via Row Level Security (RLS) rather than solely in application code.

## Architecture

- **Next.js App Router** with a mix of Server and Client Components. Data fetching for initial page loads happens in Server Components; interactive pieces (forms, drag-and-drop lists, run execution UI) are Client Components.
- **Supabase Auth** handles user sign-up/sign-in via `@supabase/ssr`, with middleware-based route protection so unauthenticated requests never reach protected pages. Sign-up is gated behind an invite code, and a demo account is available for evaluation without creating a real account.
- **Row Level Security** is enabled on every table. Policies are built around `auth.uid() is not null` — any authenticated user can read/write shared QA data, since this is a collaborative team tool rather than a per-user data silo.
- **Snapshot pattern**: `test_runs` and `run_results` do not live-reference `test_cases`/`suites` for display purposes. At run creation, the current suite composition and test case content are copied into `run_results`, including a frozen human-readable ID and the tester's display name at that point in time.
- **Projects layer**: `projects` is the top-level entity above modules, suites, and test cases, modeled on how Qase handles it. It exists because the same product can live on several platforms and test cases are mostly not shared between them. All routes live under `/projects/[code]`, a project sidebar/switcher handles navigation, and after login users always land on the Projects page first. Every authenticated user can see every project (no per-project access restrictions).
- **Human-readable IDs**: test cases, suites, and modules each get a stable, human-friendly code generated from a Postgres identity column (`seq_number`). Case IDs are prefixed with the project code and numbered per project (e.g. `DEMO-12`). These codes, not internal UUIDs, are what get snapshotted into run results, for readability in reports.
- **Cloning between projects**: cases, modules, and suites can be copied into another project (copy-only, never moved). Cloning a suite brings its cases and modules; cloning a module brings its cases. Everything gets fresh IDs in the target project, and if the target already has an active module with the same name (case-insensitive), that module is reused instead of duplicated.
- **Soft delete**: every primary resource (test cases, suites, modules) supports archive/restore instead of hard deletion, so historical run data referencing them is never orphaned.
- **Keep-alive job**: a Vercel Cron job (`vercel.json` + `src/app/api/keep-alive/route.js`) pings the database once a day to prevent the Supabase free-tier project from auto-pausing due to inactivity. The endpoint is protected by a `CRON_SECRET` header check and uses the Supabase service role key server-side only.

## Database Schema

| Table          | Purpose                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`     | User profile data (display name, role), auto-created via a trigger on new auth signups                                                             |
| `projects`     | Top-level entity with a unique, immutable code (e.g. `DEMO`) used to prefix case IDs; supports archive                                             |
| `modules`      | Groupings of test cases within a project                                                                                                           |
| `test_cases`   | Individual manual test cases, numbered per project (e.g. `DEMO-12`), with a priority field, supports archive                                       |
| `module_cases` | Join table linking test cases to modules, preserves ordering                                                                                       |
| `suites`       | Collections of test cases assembled for execution, belonging to a project, supports archive                                                        |
| `suite_cases`  | Join table linking test cases to suites, preserves ordering                                                                                        |
| `test_runs`    | A single execution instance of a suite; captures who ran it and when                                                                               |
| `run_results`  | Snapshot of each test case's state, position, code, and tester identity at run-start; holds the Pass/Fail/Blocked/Skipped/Pending outcome per case |

**Status fields are stored as plain text**, not Postgres enums, so new statuses (e.g. adding a `Cancelled` run status) can be introduced without a schema migration.

## Features

- **Projects**: a Projects landing page with admin-only create, edit, and archive; project codes are fixed once created
- **Project-scoped navigation**: all routes under `/projects/[code]`, with a sidebar/switcher and project-aware reports
- **Clone between projects**: copy test cases, modules, or suites into another project with fresh IDs
- **Test case, suite, and module CRUD** with drag-and-drop reordering (`@dnd-kit`) and priority on test cases
- **Test run engine**: start a run from a suite, execute each case with a Pass/Fail/Blocked/Skipped/Pending status (with keyboard shortcuts), tester identity frozen at run-start for historical accuracy
- **Runs dashboard**: filter by status, suite, and tester; search; date range filtering; pagination; cancelled runs tracked as a distinct status
- **Soft delete / archive & restore** across all primary resources
- **CSV import/export** with validation and module assignment (PapaParse)
- **Reporting dashboard**: pass rate trends, run activity over time, suite/module/tester breakdowns, and coverage gaps, scoped per project (Recharts)
- **Settings**: dedicated Import/Export tabs
- **Invite-code-gated signup** plus a demo account for trying the app without registering
- **Role-based profiles** with an auto-creation trigger tying each Supabase Auth user to a `profiles` row; a database trigger prevents users from escalating their own role
- **Admin panel** with user management and deactivation
- **Keep-alive cron job** to prevent the free-tier Supabase project from pausing

## Project Structure

```
.
├── public/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── users/               # Admin user management
│   │   ├── api/
│   │   │   └── keep-alive/          # Vercel Cron endpoint, pings DB daily
│   │   ├── login/
│   │   ├── signup/
│   │   ├── profile/
│   │   └── projects/
│   │       ├── new/
│   │       └── [code]/
│   │           ├── edit/
│   │           ├── modules/
│   │           │   ├── new/
│   │           │   └── [id]/
│   │           ├── suites/
│   │           │   ├── new/
│   │           │   └── [id]/
│   │           ├── test-cases/
│   │           │   ├── new/
│   │           │   └── [id]/
│   │           │       └── edit/
│   │           ├── runs/
│   │           │   └── [id]/
│   │           ├── reports/
│   │           └── settings/
│   │               ├── export/
│   │               └── import/
│   ├── components/                  # Shared UI components
│   └── lib/
│       └── supabase/                # Browser + server Supabase client setup
├── vercel.json                      # Cron schedule config
└── package.json
```

Notes on route structure:

- All project work happens under `projects/[code]/`, where `[code]` is the project's immutable code (e.g. `DEMO`). `projects/` and `projects/new` handle the Projects landing page and project creation.
- `test-cases/[id]/edit` is a dedicated edit route, while `modules/[id]` and `suites/[id]` handle editing inline rather than through a separate route.
- Each route folder follows standard App Router conventions (`page.js`, and `route.js` for the `api/keep-alive` endpoint).

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

### Database Seeding

A reusable `seed.mjs` script populates the database with realistic demo data — modules, test cases, suites, test runs, and run results — reusing existing `profiles` rows as the `started_by` value on runs.

```powershell
node seed.mjs
```

- The script uses the Supabase **service role key**, so it must be run locally (or in a controlled environment), never from client-side code.
- It wipes and refills `modules`, `test_cases`, `suites`, `test_runs`, and `run_results` — this is destructive to whatever data is currently in those tables.
- As a safety measure against accidentally targeting the wrong project, it prints the target Supabase project URL and requires typing `yes` to confirm before wiping anything.
- Two schema quirks the script (and any future inserts) must respect:
  - `seq_number` on `modules` / `suites` / `test_cases` is a `GENERATED ALWAYS AS IDENTITY` column — never include it in an insert.
  - `test_cases` has no `test_case_code` column; that field only exists on `run_results`, where it's captured as part of the run-start snapshot.
- The current script was written before the Projects layer. Updating it to seed multiple projects is the next step; until then, its demo data belongs to a single project (`Demo Storefront`, code `DEMO`).

_(Adjust the `node seed.mjs` path above if the script lives in a subfolder, e.g. `scripts/seed.mjs`, in your repo.)_

## Environment Variables

| Variable                        | Description                                                            |
| ------------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (used client-side, protected by RLS)          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key, server-side only — used by the keep-alive cron route |
| `CRON_SECRET`                   | Shared secret checked against the header on incoming cron requests     |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client — it bypasses RLS.

## Deployment

The app is deployed on Vercel. Pushing to the main branch triggers a new deployment. The Vercel Cron job defined in `vercel.json` calls `/api/keep-alive` daily at 6:00 UTC to keep the Supabase free-tier project from pausing due to inactivity.

## Key Design Decisions

- **Snapshot everything at run-start** — live references to test cases would break historical accuracy once source data changes; `run_results` freezes the test case code, position, and tester identity as of the moment a run begins.
- **Immutable project codes** — case IDs embed the project code, so changing it later would invalidate every ID already shared in reports and conversations.
- **Copy-only cloning between projects** — moving records would break run history that references them; copies get fresh IDs in the target project.
- **Everyone sees every project** — access control per product was considered and deliberately left out to keep the model simple.
- **Plain text over Postgres enums for status fields** — easier to extend with new statuses without a migration.
- **Soft delete over hard delete** for all primary resources, so archived data can't orphan historical run references.
- **"Select all" as a frozen bulk copy** when adding a module's cases to a suite, rather than a live link.
- **Simplicity over premature complexity** — features like bulk test case creation and mid-run quick-add were designed, then deliberately reversed after deciding they added complexity without real benefit.
- **Provider isolation for any future LLM integration** — planned AI features wrap model calls behind a single function (e.g. `generateTestCases(docText)`) so swapping providers later is low-risk.

---

## License

Released under the [MIT License](LICENSE).
