# Epic 1: Card activity log

**Status:** Not started
**Schema change:** None
**Risk:** Very low

## Why

`AuditLog` rows are already written for essentially every card mutation
(create, update, move, assign, block/unblock, delete) via
`writeAuditLog()` in `src/server/services/card.service.ts` — confirmed by
reading the service layer directly, not assumed. Nothing reads them back:
no router, no UI. Jira leans hard on this exact feature ("who changed
what, and when") as a trust signal for teams with multiple people touching
the same work. This is pure surfacing of data that already exists —
no migration, no new write paths, lowest-risk epic in this roadmap.

## Scope

- A new `auditLog` router with a `listByCard` query, RLS-protected like
  every other tenant-scoped read.
- An "Activity" section in `CardDetailPanel`, in the collaboration tier
  (alongside Checklist/Comments), rendering a simple reverse-chronological
  list: actor name, human-readable description of the change, relative
  timestamp.
- A small mapping from `AuditAction` + `metadata` to a human-readable
  sentence (e.g. `CARD_MOVED` + `{from: "To Do", to: "Blocked"}` →
  "moved this from To Do to Blocked").

## Non-goals

- No filtering/search within the activity log.
- No board- or org-level activity feed — card-scoped only for this epic.
- No new audit actions beyond what's already captured.

## Stories

### 1.1 — `auditLog.listByCard` query
- [ ] Add `src/schemas/auditLog.schema.ts` (`{ cardId: string }`).
- [ ] Add `src/server/routers/auditLog.ts`: `listByCard` protected
      procedure, `orderBy: { createdAt: "desc" }`, include `actor` (id,
      fullName, email).
- [ ] Register in `_app.ts`.
- [ ] Confirm via existing RLS pattern that a user outside the org gets
      zero rows even when passing a real `cardId` (spot-check, doesn't
      need a new dedicated test file — `tenant-isolation.test.ts` already
      covers the same table pattern for other entities).

### 1.2 — Human-readable formatting
- [ ] `src/lib/auditLog.ts`: `describeAuditLog(entry): string`, one
      branch per `AuditAction` that currently gets written for cards
      (check `card.service.ts` for the actual set in use — don't assume
      the full `AuditAction` enum is all reachable from card mutations).
- [ ] Falls back to a generic "updated this card" for anything
      unmapped, so a future new action doesn't render blank.

### 1.3 — UI: Activity section in card detail
- [ ] New section in `CardDetailPanel.tsx`, collaboration tier, using the
      existing `SectionLabel` convention.
- [ ] Row: avatar-less actor name (bold) + description + relative time
      (reuse the `timeAgo`-style formatting already in
      `NotificationBell.tsx` — extract it to `src/lib/time.ts` if it's
      going to be used in two places, don't duplicate it).
- [ ] Empty state: "No activity yet." (matches existing empty-state
      copy conventions — concise, no illustrations).
- [ ] Loading state: reuse `Skeleton`.

## Acceptance criteria

- Opening any card with existing history (basically all of them, given
  audit logs are already being written) shows a real, correctly-ordered
  list of what happened to it.
- A brand new card with no mutations yet shows the empty state, not an
  error or blank space.
- `tsc` / `lint` / `test` / `build` clean.
