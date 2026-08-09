# Epic 8: Reliability & security hardening

**Status:** In progress — 8.1 done, 8.2 done, 8.3 in progress (Sentry account pending), 8.4 not started
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

### 8.1 — Fix the Labels toggle race condition — DONE
- [x] `CardDetailPanel.tsx`: the Labels section (`selectedLabelIds`,
      derived fresh from `card.labels` on every render) had the exact
      client-side bug the Assignees toggle had before Epic 5's fix —
      rapid clicks could silently drop an earlier click because `next`
      was computed from stale pre-refetch server state. Fixed with the
      same `labelsDraft` local-state pattern already proven there.
- [x] **Turned out deeper than scoped**: fixing the client-side draft
      surfaced a second, server-side bug underneath it. Both
      `setCardLabels` and `setCardAssignees` in `card.service.ts`
      read the current rows, diff against the desired set, then write —
      with no locking, two overlapping requests for the *same card* can
      interleave their transactions and the one that happens to commit
      last wins, regardless of which the client issued last. Confirmed
      live: 3 rapid label clicks landed only 1 label in Postgres despite
      the client sending the correct cumulative payload each time.
      Fixed with a `select id from cards where id = $1 for update` row
      lock at the top of both functions, forcing overlapping
      transactions for the same card to serialize. This means the
      Assignees flow (Epic 5) had this exposure too, not just Labels —
      just hadn't been caught by a concurrent (not just rapid-sequential)
      request pattern before.
- [x] Added `tests/card-mutations.test.ts` regression coverage:
      `Promise.all`-fired concurrent `setLabels`/`setAssignees` calls for
      the same card, asserting the final state always matches exactly
      one full payload — never a merged/corrupted mix.

### 8.2 — Rate limiting — DONE
- [x] Used Vercel's Storage tab → Redis (Marketplace/Redis Cloud) instead
      of a separate Upstash account — same free-tier economics, one less
      external account, and Vercel auto-wires the connection env var.
      This gives a plain `REDIS_URL` connection string, not a REST
      URL/token pair, so the implementation uses `ioredis` +
      `rate-limiter-flexible`'s `RateLimiterRedis` rather than
      `@upstash/ratelimit`/`@upstash/redis`.
- [x] `src/lib/redis.ts` (cached ioredis client, same
      globalThis-caching pattern as `src/lib/prisma.ts`) and
      `src/lib/ratelimit.ts` (per-action `RateLimiterRedis` instances +
      a `checkRateLimit()` helper that fails OPEN on a Redis-level
      error — rate limiting is a safety net, not a dependency the whole
      app should go down with if Redis hiccups).
- [x] Applied to: `signup`/`login` server actions (keyed by IP via a new
      `src/lib/request-ip.ts`, reading `x-forwarded-for`), and the
      `membership.invite`/`comment.create` tRPC procedures (keyed by
      `userId`). Budgets: signup 5/hour, login 10/15min, invite 20/hour,
      comment 30/10min.
- [x] Regression test in `tests/comment-lifecycle.test.ts`: 31 rapid
      `comment.create` calls from a dedicated test user, asserting the
      31st throws a "too many requests" error.
- **Known local-dev quirk**: `next dev` has no reverse proxy setting
  `x-forwarded-for`, so `getClientIp()` falls back to a fixed
  `"local-dev"` string — every local signup/login shares one budget
  across all local testing. Not fixed with an environment-based bypass
  on purpose (a bypass in rate-limiting code is exactly the kind of
  thing that risks accidentally shipping to production); if a developer
  hits the local wall while iterating, clear it directly:
  `redis-cli -u $REDIS_URL DEL rl:signup:local-dev`.
- [x] Returns a clear `TRPCError({ code: "TOO_MANY_REQUESTS" })` for the
      tRPC procedures and a readable `{ error }` state for the server
      actions, not a silent failure — unlike `sendEmail`, a rate-limit
      rejection must be visible to the user, not swallowed.

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

- [x] Rapid sequential label toggles (Playwright script + direct DB
      query, mirroring the Epic 5 assignee verification methodology)
      result in all intended labels persisting, not just the last click
      — confirmed live, plus an automated concurrency regression test.
- [x] Hammering `comment.create` in a tight loop gets rate-limited with a
      readable error, not silently accepted forever — confirmed via the
      automated regression test (31 rapid calls, last one rejected).
- Once 8.3 lands: a deliberately-thrown error in a tRPC procedure shows
  up in the Sentry dashboard within a minute or two of triggering it.
- `docs/runbooks/backup-restore.md` exists and accurately reflects the
  current Supabase plan's actual retention — not a generic template.
- `tsc` / `lint` / `test` / `build` clean for 8.1–8.3 (8.4 is docs-only).
