# Epic 8: Reliability & security hardening

**Status:** Not started
**Schema change:** No
**Risk:** Low (8.1), Medium (8.2/8.3 — new external services), Low (8.4 — docs only)

## Why

Raised during a live Q&A about whether Kelbara is safe to trust with real
data: tenant isolation and data storage are solid (Postgres RLS, Supabase
Storage for attachments, both verified by this project's test suite), but
four concrete gaps came out of that review — one is an actual reproducible
bug, the other three are missing operational safety nets that most SaaS
products have before onboarding real customers.

Unlike epics 1–7, this isn't feature-parity work — it's closing gaps
between "the app is correct" and "the app is operable when something goes
wrong." Two of the four stories need a new free-tier external account
(Upstash, Sentry) before they can be implemented — flagged explicitly
below, don't sign up for or wire in either without checking first.

## Scope

- Fix the one known reproducible bug (Labels toggle race condition).
- Add rate limiting to abuse-prone mutations (signup, invite, comment
  creation).
- Add error monitoring so a production failure surfaces somewhere other
  than a user's bug report.
- Document and confirm the actual backup/restore posture on the current
  Supabase plan — this story produces a doc, not new infrastructure,
  since Supabase already handles backups at the platform level.

## Non-goals

- No general-purpose API rate limiting framework — just the handful of
  procedures that are actually abuse-prone (unauthenticated or
  low-friction: signup, invite, comment). Board/card CRUD stays
  unthrottled; a legitimate team moving cards quickly shouldn't get
  rate-limited.
- No custom backup tooling — Supabase's platform backups are the backup
  strategy; this epic only verifies and documents them, doesn't rebuild
  them.
- No APM/performance monitoring beyond error tracking — Sentry error
  capture only, not full tracing, in this pass.

## Stories

### 8.1 — Fix the Labels toggle race condition
- [ ] `CardDetailPanel.tsx`: the Labels section (`selectedLabelIds`,
      currently derived fresh from `card.labels` on every render) has
      the exact bug the Assignees toggle had before Epic 5's fix —
      rapid clicks can silently drop an earlier click because `next` is
      computed from stale pre-refetch server state. Apply the identical
      fix already proven there: a local `labelsDraft` state
      (`Set<string>` or `string[]`), synced from `card.labels` only on
      genuine card-switch (the established "adjust state during render"
      pattern, not `useEffect`), updated synchronously on every toggle
      click before firing `setLabels.mutate`.
- [ ] No schema/router changes — this is a client-side state bug only,
      `setLabels` itself is already correct (replaces the full set).

### 8.2 — Rate limiting (needs an Upstash account first)
- [ ] **Before writing code**: confirm with the user whether to create a
      free-tier Upstash Redis account (10k commands/day free) — this is
      the standard approach for rate limiting on Vercel's serverless
      functions, since in-memory counters don't share state across
      function invocations. Get the REST URL + token into `.env.local`
      and Vercel before implementing.
- [ ] `@upstash/ratelimit` + `@upstash/redis`, a small
      `src/lib/ratelimit.ts` helper wrapping a sliding-window limiter.
- [ ] Apply to: `POST /signup`, `POST /login` (both server actions, not
      tRPC procedures — check `src/app/(auth)/*/actions.ts`), the
      `membership.invite` and `comment.create` tRPC procedures. Keyed by
      IP for the unauthenticated auth actions, by `userId` for the
      authenticated tRPC procedures.
- [ ] Return a clear `TRPCError({ code: "TOO_MANY_REQUESTS" })` /
      equivalent server-action error, not a silent failure — the UI
      needs to show something readable, not swallow it like `sendEmail`
      does.

### 8.3 — Error monitoring (needs a Sentry account first)
- [ ] **Before writing code**: confirm with the user whether to create a
      free-tier Sentry account (5k errors/month free) and get a DSN into
      `.env.local` / Vercel.
- [ ] `@sentry/nextjs` via its standard install wizard
      (`npx @sentry/wizard@latest -i nextjs`) — this generates the
      config files itself, don't hand-rewrite what it produces.
- [ ] Confirm it captures both client-side and server-side (tRPC
      procedure) errors — tRPC errors thrown inside `protectedProcedure`
      should reach Sentry, not just unhandled client exceptions.
- [ ] Don't add Sentry breadcrumbs/context that leak cross-tenant data
      (e.g. don't log full request payloads containing another org's
      data) — scrub or limit context to IDs, not full row contents.

### 8.4 — Document backup/restore posture (no code)
- [ ] Check the current Supabase project's plan and confirm what backup
      retention it actually provides (free tier vs. Pro-tier
      point-in-time recovery differ significantly).
- [ ] Write `docs/runbooks/backup-restore.md`: what's backed up
      automatically, how far back, and the exact steps to restore from
      the Supabase dashboard if ever needed. This is a reference doc for
      an incident, not a feature.
- [ ] If the current plan's retention is thin (e.g. free tier's short
      window), flag that explicitly as a decision point for the user
      rather than silently upgrading a paid plan.

## Acceptance criteria

- Rapid sequential label toggles (mirroring the Epic 5 assignee
  verification methodology — Playwright script + direct DB query) result
  in all intended labels persisting, not just the last click.
- Once 8.2 lands: hammering `comment.create` or `membership.invite` in a
  tight loop gets rate-limited with a readable error, not silently
  accepted forever.
- Once 8.3 lands: a deliberately-thrown error in a tRPC procedure shows
  up in the Sentry dashboard within a minute or two of triggering it.
- `docs/runbooks/backup-restore.md` exists and accurately reflects the
  current Supabase plan's actual retention — not a generic template.
- `tsc` / `lint` / `test` / `build` clean for 8.1–8.3 (8.4 is docs-only).
