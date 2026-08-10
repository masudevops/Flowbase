# Epic 3: Blocked-by linked card

**Status:** Done — shipped and verified live
**Schema change:** Additive — one nullable self-relation FK on `Card`
**Risk:** Low

## Why

Today `Card.isBlocked` + `Card.blockedReason` is a boolean and a freetext
string — "Blocked — waiting on design review" as plain text, with no
connection to whatever is actually causing the block. Jira's issue
linking ("blocked by PROJ-123") is more useful precisely because it's
navigable: click through and see the real state of the blocker. This
keeps the existing freetext reason (it's still the right tool for "blocked
by a client decision" or anything that isn't itself a tracked card) and
adds an *optional* structured link on top, rather than replacing one
mechanism with the other.

## Scope

- `Card.blockedByCardId` — nullable self-relation, `onDelete: SetNull`
  (deleting the blocking card shouldn't cascade-delete the blocked one,
  mirrors the existing `parentCardId` pattern exactly).
- Card detail: an optional "Blocked by" card picker, scoped to the same
  board (same UX as the existing Parent picker — copy that pattern, don't
  invent a new one).
- Card front / My Work / Backlog: when `blockedByCardId` is set, show
  the linked card's title instead of (or alongside) the freetext reason,
  click-through to open it.

## Non-goals

- No general-purpose "relates to" / "duplicates" link types — scoping
  strictly to "blocked by," which is the one Kelbara already has a
  concept for.
- Not cross-board linking — same constraint as Parent already has.
- Not auto-unblocking when the linked card reaches a done column (that's
  a workflow-automation decision explicitly out of scope per the
  roadmap's excluded list).

## Stories

### 3.1 — Schema
- [ ] Add `blockedByCardId String? @map("blocked_by_card_id")` +
      `blockedByCard Card? @relation("CardBlockedBy", fields:
      [blockedByCardId], references: [id], onDelete: SetNull)` +
      back-relation `blocking Card[] @relation("CardBlockedBy")`.
- [ ] `@@index([blockedByCardId])`.
- [ ] Purely additive — `prisma migrate dev` should apply cleanly, no
      hand-written SQL needed (mirrors how `sourceTemplateId` landed in
      the workflow-templates build).
- [ ] Update `prisma/rls/*.sql` only if a new table were added — it
      isn't, so no RLS changes required here (existing `cards` policy
      already covers the new column).

### 3.2 — Service + router
- [ ] Extend `card.service.ts`'s `toggleBlocked` (or add a sibling
      function) to accept an optional `blockedByCardId`, validated to
      belong to the same board as the card being blocked (reject
      cross-board references server-side, same as Parent already
      validates implicitly by only listing same-board cards client-side
      — but don't rely on the client alone, check it in the mutation).
- [ ] Update `card.update`/`card.toggleBlocked` zod schema accordingly.

### 3.3 — UI
- [ ] `CardDetailPanel.tsx`: in the existing Blocked section, add a
      `Select` (same board-cards list already fetched for the Parent
      picker — reuse `boardCards`, don't add a second query) that
      appears once "Blocked" is checked. "None" stays valid — freetext-
      only blocking remains supported.
- [ ] When `blockedByCard` is present, render its title as a clickable
      chip (`onOpenCard`) instead of/alongside the freetext reason.
- [ ] `CardPreview.tsx`: if blocked-by a card, show that card's title
      truncated in the existing blocked-reason badge slot.

## Acceptance criteria

- Blocking a card with a same-board card selected shows that card's
  title everywhere the reason currently shows, and clicking it opens
  the linked card via the existing `onOpenCard` panel-switch mechanism.
- Deleting the blocking card un-links it (`blockedByCardId` → null)
  without deleting or otherwise corrupting the blocked card.
- Existing freetext-only blocked cards (no linked card) keep working
  exactly as before — this is additive, not a replacement.
- `tsc` / `lint` / `test` / `build` clean, plus a new test case in
  `tests/card-mutations.test.ts` covering blocked-by-card set/clear and
  the on-delete-SetNull behavior.
