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

### Live collaboration
- **Real-time sync** (Supabase Realtime): card and column changes made by one person appear for everyone else viewing the same board within seconds, no manual refresh — verified with two simultaneous sessions, both card creation and drag-and-drop moves. Required fixing a real RLS gap: Realtime authenticates via Supabase's native `auth.uid()`, which our custom Postgres-direct RLS bridge didn't recognize until now (`app.current_user_id()` was extended to check both paths, and needed `SECURITY DEFINER` to actually call `auth.uid()`, since `postgres` itself can't delegate schema access it doesn't own on Supabase's platform — see `prisma/rls/001_helper_functions.sql`)
- **Email notifications** (via Resend): assigned a card → email; someone comments on a card you're assigned to → email. Never notifies you of your own actions. Verified end-to-end (mutations succeed, Resend API is called correctly) — actual delivery to arbitrary recipients needs a verified domain in Resend (currently sandboxed to the account owner's own address, a Resend platform restriction, not a bug)
- **Deep links**: a notification email links straight to the specific card (`/boards/[id]?card=[cardId]`), opening its detail panel automatically — not just the board

### Attachments
- Photo/file attachments on cards (Supabase Storage, free tier) — image thumbnails inline, other files as a download link, size shown, uploader shown
- Private bucket, not public URLs: access is enforced by Postgres RLS on `storage.objects` (same tenant-isolation model as every table), files viewed via short-lived (1 hour) signed URLs generated on demand — verified directly: an authenticated user who isn't a member of the org gets "Object not found" trying to sign a URL for another org's file, not just a UI-level block
- 20MB per-file ceiling (Supabase free tier gives 1GB total storage)

### Design
- Palette and type system inspired by Jira and Monday.com (their actual token colors — Jira's navy `#172B4D`, status reds/greens/purples — not a generic guess), applied consistently across the whole app, not just the landing page
- Public marketing page at `/` with an interactive demo (live toggle between IT/Dev and Construction board vocabulary), responsive, dark-mode aware

### Infrastructure
- Next.js 16 + TypeScript + Tailwind v4, tRPC for typed client-server calls, Prisma + Supabase Postgres, Supabase Auth
- Deployed on Vercel (free tier), database on Supabase (free tier)
- Local dev: seed script for demo data, RLS setup scripts, migration workflow documented in `prisma/rls/README.md` and `ARCHITECTURE.md`

## 🚧 Next up

Agreed order for "practical features to attract external users": ~~real-time sync~~ → ~~notifications~~ → ~~file attachments~~ → **search**.

- **Basic search** across cards/boards
- **Members & invites** — schema (`Invite`, `Membership`) and a `Contact` model (for assigning cards to people without a Flowbase account — subcontractors, etc.) exist in the database and RLS is set up for both, but the actual invite-by-email flow, accept-invite page, and Contact CRUD/UI aren't built yet. This was in progress before real-time sync took priority.
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
