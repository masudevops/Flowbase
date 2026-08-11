# System architecture diagram

**Last verified:** 2026-08-11, against the live source tree at that commit.

`system-architecture.html` is a self-contained, static diagram of Kelbara's
request lifecycle — browser through to Postgres — built from a direct
codebase audit, not from memory. Every box names the actual file that
implements it (`src/server/rls.ts`, `middleware.ts`,
`prisma/rls/002_policies.sql`, etc.), so it doubles as a map for finding
where a given piece of behavior actually lives.

Open it directly in a browser — no build step, no dependencies. It respects
the OS light/dark preference.

## Keeping this current

This is a snapshot, not a generated diagram — nothing regenerates it
automatically when the code changes. Treat it the way `docs/roadmap/`
epics are treated: update it deliberately when the architecture actually
shifts (a new external service, a new background job, a change to the RLS
bridge), not on every commit. If it drifts far enough from the code to be
actively misleading, that's worse than deleting it — check it against
`src/server/rls.ts`, `middleware.ts`, and `prisma/schema.prisma` before
trusting it at a glance for anything load-bearing.
