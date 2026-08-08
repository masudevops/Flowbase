# Tests

These are **real integration tests**, not mocks. Each test builds a tRPC
caller (`tests/helpers/caller.ts`) via `appRouter.createCaller({ userId })`
— no HTTP, no browser, but every call still goes through the exact same
`protectedProcedure` → `withRlsContext` → Postgres RLS chain a real
request would. Given how much this app leans on RLS for tenant isolation
(see `prisma/rls/`), testing that boundary against a mocked Prisma client
would prove nothing — it has to hit the real database.

**Run with `npm test`** (loads `.env.local`, same as every other DB
script in this repo — `db:migrate`, `db:seed`, etc.).

## What's covered

- `tenant-isolation.test.ts` — the core proof: a user in org A cannot
  read or write org B's boards, cards, members, or card types, even when
  supplying org B's real ids directly.
- `membership-authorization.test.ts` — admin/member permission
  boundaries (invite, role change, removal, board deletion) and the
  "an org always keeps at least one admin" invariant.
- `cardtype-scoping.test.ts` — proves card types are board-scoped, not
  org-scoped (the fix in the commit right before this test suite).
- `card-mutations.test.ts` — sanity coverage for the everyday card
  lifecycle (create, move, assign, block/unblock, parent/child) that
  everything else depends on staying correct.

This is deliberately not exhaustive coverage of every router — it
protects the things that would be expensive or dangerous to get wrong
silently (cross-tenant data exposure, permission bypass), per the
product audit that prompted this build. Add to these files as new
authorization-sensitive surface area ships; it's not meant to be the
only place tests ever live.

## Fixtures & cleanup

`tests/helpers/fixtures.ts` creates orgs/users/memberships directly via
a superuser (`DIRECT_URL`) connection — same reasoning as
`prisma/seed.ts`: there's no logged-in session to satisfy RLS's INSERT
checks during setup, and setup isn't the thing under test. Every test
file tracks the org ids it creates and deletes them in `afterAll` —
deleting an org cascades to everything under it (memberships, boards,
columns, cards, card types, etc.), so that's the entire cleanup story.

If a test run is ever interrupted before `afterAll` runs, orphaned rows
will have a `slug` starting with `test-` and are safe to delete manually.
