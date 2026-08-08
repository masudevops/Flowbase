# Kelbara Architecture

Kelbara is a multi-tenant, Kanban-based project management app for small teams — initially targeting IT/dev teams and construction/trade teams as two industry-flavored templates on top of one shared engine. This doc explains how the pieces fit together for anyone picking up the project cold.

## Status

As of this doc, **auth and workspace onboarding are built**; board/card CRUD, the Kanban UI, backlog view, filters, and dashboard are not yet built (see [Roadmap](#roadmap)). If you're orienting yourself, `src/app/(app)/w/[orgSlug]/page.tsx` is the placeholder for where the board list/dashboard will go next.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript | Server Components for fast first paint, Server Actions for simple form mutations |
| Styling | Tailwind CSS v4 | No design-system dependency, fast to iterate |
| Database | PostgreSQL via Supabase (free tier) | Managed Postgres + Auth + (later) Storage from one backend |
| ORM | Prisma 6.19 (pinned — see below) | Type-safe schema/queries, mature migration tooling |
| Auth | Supabase Auth (email/password + Google OAuth) | Free, no separate auth service to run |
| Internal API | tRPC | End-to-end type safety between server and client with no separate API schema |
| Validation | Zod | Server-side input validation on every tRPC procedure |
| Drag-and-drop | @dnd-kit (installed, not yet used) | For the Kanban board, next phase |
| Hosting | Vercel (free tier) | Pairs naturally with Next.js |

**Why Prisma 6, not 7**: `npm install prisma` currently resolves to 7.x, which changed generator/output behavior in ways this project hasn't been validated against. Pinned to 6.19.3 (see `package.json`) because the RLS session-variable bridge (below) depends on well-understood `$transaction`/raw-SQL behavior. Revisit the pin once Prisma 7 has settled and there's a reason to move.

## Multi-tenancy model

**One `Organization` model is both the tenant boundary and the user-facing "workspace"** — there is no separate `Workspace` model nesting above or below it. A user can belong to multiple organizations via the `Membership` join table (`organizationId`, `userId`, `role`), which is also how "multiple workspaces per user" is achieved without a second hierarchy level.

Every tenant-scoped table carries `organizationId` **directly**, even where it's technically derivable through a parent relation (e.g. `Column.organizationId` is redundant with `Column.boardId → Board.organizationId`). This is deliberate: it keeps every Row-Level Security policy a single-table check instead of a multi-hop join, and keeps app-level query filters (`where: { organizationId }`) equally cheap everywhere.

## Data model

Full source of truth: `prisma/schema.prisma`. Key shapes:

- **`Organization`** — the tenant. Has `slug` (used in URLs as `/w/[slug]`), `Membership[]`, `Board[]`, etc.
- **`User`** — mirrors a Supabase `auth.users` row (`id` is the same UUID). Holds no `organizationId` — profile-only.
- **`Membership`** — join table with `role` (`ADMIN` | `MEMBER`) and `status` (`INVITED` | `ACTIVE` | `SUSPENDED`).
- **`Invite`** — pending email invite, keyed by a token. A user accepts an invite by creating *their own* `Membership` row (see [RLS](#row-level-security) — this matters for how the insert policy is written).
- **`Board`** → **`Column[]`** → **`Card[]`**. Columns and cards both carry a fractional-index `position: String` (via the `fractional-indexing` package) for drag-and-drop ordering — a single-row update on reorder, not a transactional resequence of every row after it.
- **`CardType`** and **`Label`** are per-organization **rows**, not enums. This is what makes card types (Task/Bug/Feature vs. Task/Punch-Item/Inspection) and the overall vocabulary customizable per workspace — the core product differentiator between the IT/Dev and Construction templates.
- **`Card.isBlocked`** is independent of which column a card sits in (`Column.isBlockedColumn` is a hint, not the source of truth). Confirmed UX: moving a card into a column with `isBlockedColumn = true` auto-sets `isBlocked = true` (and clears it on move-out), but a user can also manually flag/unflag a card in any column. Dashboard and filter queries always read `Card.isBlocked` directly — never re-derive it from column membership.
- **`AuditLog`** — generic `(entityType, entityId)` pointer + a `cardId` convenience FK for fast per-card history queries, plus a `metadata: Json` diff blob. Not yet written to by any mutation (there are no card/board mutations yet) — `AuditAction` enum and the table exist ahead of that.
- **`WorkspaceModuleSetting`** — minimal enablement table for future opt-in modules (Wiki, Time Tracking, Calendar). Kanban itself is always-on and has no row here. No content models (`WikiPage`, `TimeEntry`) exist yet — adding them later is a purely additive migration, nothing above needs to change.
- Two Phase-3 columns exist ahead of the feature that uses them: `Card.approverId` / `Card.approvedAt`, for an eventual inspection/sign-off workflow. Cheap nullable columns now avoid a backfill migration later; a real `Sprint`/cycle model was deliberately **not** pre-added the same way, since it's a new entity with its own lifecycle, not a couple of columns — see the plan history for the reasoning if it resurfaces.

## Auth flow

1. **Signup / login** (`src/app/(auth)/{signup,login}/page.tsx` + `actions.ts`) — Next.js Server Actions call Supabase's `signInWithPassword` / `signUp` directly. Google OAuth is a client-side button (`components/auth/GoogleAuthButton.tsx`) that calls `signInWithOAuth`.
2. **`ensureUserRecord`** (`src/lib/auth.ts`) — upserts a `User` row keyed by the Supabase user's UUID, called after every successful sign-in (password login, signup, and the OAuth callback). This is how `auth.users` gets mirrored into our own `users` table — no Supabase DB trigger involved, it's plain application code.
3. **OAuth callback** (`src/app/(auth)/callback/route.ts`) — exchanges the auth code for a session, calls `ensureUserRecord`, redirects to `/onboarding`.
4. **Middleware** (`src/lib/supabase/middleware.ts`, wired from root `middleware.ts`) — runs on every request. Refreshes the Supabase session cookie, **and** redirects unauthenticated requests to `/login` for anything except `/`, `/login`, `/signup`, `/callback`, and `/api/*`. This is the primary auth gate — it runs before any page code, so unauthenticated users never reach a Server Component that would otherwise throw an `UNAUTHORIZED` tRPC error.
5. **`(app)/layout.tsx`** — a second, redundant auth check (defense in depth) for anything under the `(app)` route group.
6. **Onboarding** (`src/app/(app)/onboarding/page.tsx`) — if the signed-in user has zero memberships, they land here and create their first org via `organization.create`; if they already belong to one or more, they're redirected straight to `/w/[slug]` of the first one.
7. **Workspace shell** (`src/app/(app)/w/[orgSlug]/layout.tsx`) — resolves the org by slug via `organization.bySlug`, which also verifies the caller is an active member (throws `NOT_FOUND` otherwise, rendered as a 404). Renders a header with sign-out; page content nests below.

## tRPC + the RLS bridge

This is the part most worth understanding before touching any mutation code.

**The problem**: Supabase's Row-Level Security normally keys off `auth.uid()`, populated automatically when a request goes through Supabase's own PostgREST/pooler layer. Prisma connects **directly** to Postgres over a plain connection string — `auth.uid()` is never populated on that connection, so out of the box, RLS policies written against it would see no one as authenticated.

**The bridge** (`src/server/rls.ts` — `withRlsContext`):
1. Every `protectedProcedure` (defined in `src/server/trpc.ts`) requires `ctx.userId` to be set (from the verified Supabase session — see `src/server/context.ts`).
2. It then wraps the actual procedure logic in `prisma.$transaction(...)`, and as the first statement in that transaction runs:
   ```sql
   select set_config('request.jwt.claim.sub', $userId, true)
   ```
   The `true` third argument makes this **transaction-local**, not session-local — critical, because Supabase's connection pooler (PgBouncer, transaction mode) can hand the underlying physical connection to a different request between transactions. A session-scoped `set_config` would leak identity across requests; the transaction-scoped form can't.
3. `ctx.db` inside the procedure is that transaction client — every Prisma call the procedure makes runs with the session variable set.
4. In Postgres, `prisma/rls/001_helper_functions.sql` defines `app.current_user_id()` (reads that GUC) and `app.current_org_ids()` (a `SECURITY DEFINER` function returning the set of orgs the current user has an *active* membership in). `prisma/rls/002_policies.sql` defines the actual per-table policies against those functions.
5. **This only matters once Prisma connects as a non-`BYPASSRLS` role.** Supabase's default `postgres` role bypasses RLS entirely — silently. The RLS README (`prisma/rls/README.md`) documents creating a dedicated `app_user` role and switching `DATABASE_URL`/`DIRECT_URL` to use it. Until that's done, RLS is defined but not actually enforced — application-level `where: { organizationId }` filters are doing all the real work in the meantime, and every query still goes through this bridge so switching to the enforcing role later needs no code changes.

**The bootstrap wrinkle**: creating a *brand-new* organization can't satisfy a blanket "must already belong to this org" policy, because the very membership that would grant access doesn't exist yet at insert time. `organizations` and `memberships` are the two tables with **per-command** policies instead of one blanket `USING`/`WITH CHECK`: INSERT is permissive (any authenticated `app_user` session may create a new org, or insert a membership row for *themselves* — e.g. accepting an invite), while SELECT/UPDATE/DELETE stay tenant-scoped. See the comments in `002_policies.sql` for the exact policies.

**Server Components vs. the browser client**: `src/server/caller.ts` exports `createServerCaller()` / `requireServerCaller()`, which build a tRPC caller directly from a Server Component's request context (skipping the HTTP round-trip) but still going through the exact same `protectedProcedure` → RLS-transaction path. This matters — it means Server Components never query Prisma ad hoc and accidentally bypass the RLS bridge; there is exactly one path into the database for tenant-scoped data, regardless of whether the caller is a Server Component or the browser's React Query client (`src/trpc/client.ts` + `Provider.tsx`).

```
Browser (React Query)          Server Component
        │                              │
        ▼                              ▼
  /api/trpc/[trpc]              createServerCaller()
        │                              │
        └──────────────┬───────────────┘
                        ▼
              protectedProcedure
           (requires ctx.userId, else
            401 / redirect to /login)
                        │
                        ▼
              withRlsContext(userId, fn)
           prisma.$transaction(tx => {
             set_config('request.jwt.claim.sub', userId, true)
             return fn(tx)   // ctx.db in the procedure
           })
                        │
                        ▼
                 Postgres, RLS policies
              evaluate app.current_org_ids()
```

## Folder structure

```
prisma/
  schema.prisma          # all models — see Data model above
  seed.ts                 # local demo data (org, user, board, cards)
  rls/
    001_helper_functions.sql   # app.current_user_id(), app.current_org_ids()
    002_policies.sql            # per-table RLS policies
    README.md                   # how/when to (re-)apply them

src/
  app/
    page.tsx               # "/" — landing page, redirects signed-in users to /onboarding
    layout.tsx              # root layout, wraps everything in TRPCProvider
    (auth)/                 # login, signup, OAuth callback — layout redirects signed-in users away
    (app)/                  # everything requiring auth
      layout.tsx             # auth gate (defense in depth; middleware is the primary gate)
      onboarding/             # create-first-org flow
      w/[orgSlug]/            # all workspace-scoped pages nest here
        layout.tsx              # resolves org by slug + membership, renders header
        page.tsx                # dashboard/board-list placeholder — NOT YET BUILT
    api/trpc/[trpc]/route.ts  # tRPC fetch adapter

  server/
    trpc.ts                 # publicProcedure / protectedProcedure definitions
    context.ts               # createContext() — resolves ctx.userId from the Supabase session
    rls.ts                    # withRlsContext() — the bridge described above
    caller.ts                 # server-side tRPC caller for use in Server Components
    routers/
      _app.ts                  # root router — merges feature routers
      organization.ts           # listMine, bySlug, create
    services/
      organization.service.ts   # slug generation + org+membership creation logic
    templates/                # NOT YET BUILT — IT/Dev + Construction board templates go here

  schemas/                  # Zod schemas, one file per router, mirrors server/routers/
  lib/
    prisma.ts                 # PrismaClient singleton
    auth.ts                    # ensureUserRecord()
    fractional-index.ts        # positionBetween()/positionsBetween() wrapper
    supabase/{client,server,middleware}.ts
  components/
    ui/                      # generic primitives (Button, Input — grows as needed)
    auth/                    # GoogleAuthButton, SignOutButton
    board/, card-detail/, backlog/, dashboard/, members/   # NOT YET BUILT
  trpc/
    client.ts                 # createTRPCReact<AppRouter>()
    Provider.tsx               # React Query + tRPC provider, wraps the app in root layout.tsx

middleware.ts               # thin wrapper around lib/supabase/middleware.ts's updateSession()
```

## Adding a new tenant-scoped table

When a new feature needs a new table (e.g. the eventual `WikiPage`):

1. Add the model to `schema.prisma` with a direct `organizationId` field (denormalized, per the multi-tenancy model above), run `npm run db:migrate`.
2. Add a matching policy block to `prisma/rls/002_policies.sql` (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY`) and re-run it against the database — this is a manual step, nothing enforces it automatically, so treat it as part of the same change.
3. Add a Zod schema in `src/schemas/`, a service in `src/server/services/` if the logic is non-trivial, and a router in `src/server/routers/`, built on `protectedProcedure` so it automatically goes through the RLS bridge. Wire it into `src/server/routers/_app.ts`.

## Roadmap

Not yet built, in the stated order:

1. **Workspace/board CRUD** — board creation (blank or from the IT/Dev / Construction template), column CRUD (rename/reorder/add/delete), card-type CRUD. `src/server/templates/` doesn't exist yet.
2. **Kanban board** — drag-and-drop via `@dnd-kit` (installed, unused).
3. **Card detail view** — description (markdown, `react-markdown` installed), assignee, priority, due date, labels, blocked flag/reason, comments, checklist.
4. **Backlog view** — filterable/sortable list, separate from the board.
5. **Filters** — by assignee, priority, label, blocked status.
6. **Dashboard** — open/blocked/overdue counts per board.

Explicitly deferred (Phase 2/3, don't build ahead of being asked): activity feed/notifications, file attachments (needs Supabase Storage), time tracking, calendar view, swimlanes, CSV export, dark mode, sprint/cycle grouping, inspection sign-off workflow, the Wiki module, AI suggestion features.
