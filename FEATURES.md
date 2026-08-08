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
- Audit log: board, column, and card actions (created/updated/moved/blocked/unblocked/deleted) are recorded with who did it and when (`AuditLog` table) — verified live, in the correct order, with correct actor/entity IDs

### Boards
- Create a board blank, or from a starter template:
  - **IT / Dev** — Backlog, To Do, In Progress, Blocked, In Review, Done; Task/Bug/Feature card types
  - **Construction** — Backlog, Scheduled, In Progress, Blocked/Waiting on Inspection, Punch List, Complete; Task/Punch Item/Inspection card types
- Board list per workspace
- Column management: rename, reorder (up/down), add, delete (blocked if the column still has cards, to avoid silently losing them)

### Kanban board & cards
- Real drag-and-drop (via `@dnd-kit`) — move cards between columns and reorder within a column
- Moving a card into a column marked "blocked" auto-flags it blocked; moving it back out auto-clears that (a manual block set while sitting in a non-blocked column is left alone by moves through other columns)
- Card detail panel (slide-over, Jira/Monday-style — no full page navigation): title, description (markdown text, not yet rendered as rich markdown in view mode), card type, priority, assignee (from workspace members), due date, location/zone field, color-coded labels, blocked flag + reason, checklist, comments
- Inline "+ Add card" per column

### Backlog & filters
- Per-board backlog view: every card on the board as a filterable/sortable table (filter by assignee, priority, label, blocked status; sort by priority/due date/title) — click a row to open the same card detail panel

### Dashboard
- Per-board open/blocked/overdue counts on the workspace home page

### Design
- Palette and type system inspired by Jira and Monday.com (their actual token colors — Jira's navy `#172B4D`, status reds/greens/purples — not a generic guess), applied consistently across the whole app, not just the landing page
- Public marketing page at `/` with an interactive demo (live toggle between IT/Dev and Construction board vocabulary), responsive, dark-mode aware

### Infrastructure
- Next.js 16 + TypeScript + Tailwind v4, tRPC for typed client-server calls, Prisma + Supabase Postgres, Supabase Auth
- Deployed on Vercel (free tier), database on Supabase (free tier)
- Local dev: seed script for demo data, RLS setup scripts, migration workflow documented in `prisma/rls/README.md` and `ARCHITECTURE.md`

## 🚧 Next up (rest of MVP)

- **Members & invites** — invite teammates by email (Resend is wired for the account, not yet used for sending), Admin/Member role management UI (membership listing already exists, used for the assignee dropdown — inviting/removing people is what's missing)
- **Card type management UI** — types currently come from templates only; no in-app way to add/edit/delete a workspace's card types yet
- **Rendered markdown** in the card description (currently plain text in and out — `react-markdown` is already installed, just not wired into the view mode)

## 💡 Ideas borrowed from Jira/Monday, worth considering (not started)

Not a commitment — flagging where a "best of both" idea could genuinely improve the product, since that's what was asked for:
- **Monday-style automations** ("when moved to Done, notify assignee") — Monday's signature feature; would need a small rules engine, real scope, not a quick add
- **Jira-style epics** (a card that groups other cards) — useful for the IT template's sprint planning; would need a self-referencing relation on `Card`
- **Multiple board views** beyond Kanban + the backlog table — a calendar or timeline view (see Phase 2 below) is the natural next one

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
