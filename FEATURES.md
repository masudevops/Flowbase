# Flowbase — Feature Tracker

A running list of what's actually built and verified vs. what's planned. Update this as features land — it's meant to be the source of truth for "what can I show/sell today," not a wishlist.

## ✅ Built (verified working, live on Vercel)

### Accounts & workspaces
- Sign up / log in with email + password
- Google OAuth button is wired up in the UI, but **not usable yet** — needs a Google Cloud OAuth client configured in the Supabase dashboard (Authentication → Providers → Google). No code work required, just dashboard config, whenever you want it.
- Onboarding flow: first-time users create their workspace (organization) right after signup
- Multi-tenant from day one: a user can belong to multiple workspaces (schema supports it), each with its own boards, members, and data
- Workspace resolved by URL slug (`/w/your-org`)

### Security & data isolation
- Every table scoped by `organizationId`
- Postgres Row-Level Security enforced at the database level (not just app-level checks) — verified live: a second user cannot see a first user's workspace even with a direct URL, confirmed by Postgres itself rejecting the query, not just the UI hiding it
- Audit log: board and column creates/updates/deletes/reorders are recorded with who did it and when (`AuditLog` table) — foundation is in place for card-level actions too, once cards exist

### Boards
- Create a board blank, or from a starter template:
  - **IT / Dev** — Backlog, To Do, In Progress, Blocked, In Review, Done; Task/Bug/Feature card types
  - **Construction** — Backlog, Scheduled, In Progress, Blocked/Waiting on Inspection, Punch List, Complete; Task/Punch Item/Inspection card types
- Board list per workspace
- Column management: rename, reorder (up/down), add, delete (blocked if the column still has cards, to avoid silently losing them)
- Board view currently shows columns read-only (no cards yet — see "In progress" below)

### Landing page
- Public marketing page at `/` with an interactive demo (live toggle between IT/Dev and Construction board vocabulary), responsive, dark-mode aware

### Infrastructure
- Next.js 16 + TypeScript + Tailwind v4, tRPC for typed client-server calls, Prisma + Supabase Postgres, Supabase Auth
- Deployed on Vercel (free tier), database on Supabase (free tier)
- Local dev: seed script for demo data, RLS setup scripts, migration workflow documented in `prisma/rls/README.md` and `ARCHITECTURE.md`

## 🚧 Next up (rest of MVP, in order)

- **Kanban board with drag-and-drop** — actual cards on the board, moving between columns via `@dnd-kit`
- **Card detail view** — title, markdown description, assignee, priority, due date, due-date, labels (color-coded), blocked flag + reason (independent of column), card type, optional location/zone field, comments, checklist/sub-tasks
- **Backlog view** — separate filterable/sortable list of unscheduled cards, drag into a board when ready
- **Members & invites** — invite teammates by email (Resend is wired for this, not yet used), Admin/Member roles
- **Filters** — by assignee, priority, label, blocked status
- **Dashboard** — open/blocked/overdue counts per board

## 📋 Planned (Phase 2 — after MVP is solid, not started)

- Activity feed / in-app notifications
- File attachments on cards (needs Supabase Storage — free tier, not yet configured)
- Time tracking (estimated vs. actual)
- Calendar view of due dates
- Swimlanes (group board rows by assignee, priority, or location)
- CSV export of a board/backlog
- A manual dark-mode toggle (dark mode already *renders* correctly today based on OS/browser preference — there's just no in-app switch to override it)
- Sprint/cycle grouping for the IT template (start/end dates, burndown-lite view)
- Inspection/sign-off workflow for the Construction template (a named approver must sign off before a card reaches "Complete" — the schema already has the columns for this, `Card.approverId`/`approvedAt`, unused until this ships)
- Lightweight wiki module (markdown pages per workspace, opt-in)

## 🔮 Planned (Phase 3 — later)

- AI suggestions: draft a card description from a short note, summarize a long comment thread, suggest priority/labels — always a suggestion the user accepts/edits, never an auto-write, scoped strictly to one workspace's data

---
*Last updated: 2026-08-08. Cross-reference `ARCHITECTURE.md` for how things are built; this file is about what's built.*
