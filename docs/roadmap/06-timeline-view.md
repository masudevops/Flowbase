# Epic 6: Timeline / roadmap view

**Status:** Done — shipped and verified live
**Schema change:** Additive — one nullable `startDate` on `Card`
**Risk:** Medium (new view, non-trivial layout math; no data risk)

## Why

This is the single most visible "looks like a mature PM tool" gap.
Kelbara's Calendar view is due-date-only (one point in time per card);
Jira/Trello-tier tools show work as duration bars across a date axis. Of
everything in this roadmap, this is the one most likely to make Kelbara
*look* like it belongs in the same category at a glance.

## Scope

- `Card.startDate`, nullable, alongside the existing `dueDate` — a card
  with only a due date still shows as a single-day marker (no forced
  data entry for boards that don't use it, matching the existing
  progressive-disclosure principle used everywhere else in the app).
- A new `/boards/[boardId]/timeline` view: horizontal date axis, one row
  per card (or per swimlane grouping, reusing Epic 4's grouping if it's
  landed by then — optional, don't block this epic on that one), cards
  rendered as bars from `startDate` to `dueDate` (or a fixed-width marker
  if only `dueDate` is set).
- Toolbar entry point alongside Backlog/Calendar/Manage columns.

## Non-goals

- No dependency arrows between cards (that's real Gantt-chart territory
  and meaningfully more complex — explicitly deferred).
- No drag-to-reschedule in v1 — read-only timeline first, editing is a
  natural fast-follow once the view itself is validated as useful.
- No zoom levels (week/month/quarter) for v1 — a single sensible default
  range (e.g. rolling 8 weeks centered on today) is enough to ship.

## Stories

### 6.1 — Schema
- [ ] `Card.startDate DateTime? @map("start_date")`, purely additive,
      standard `prisma migrate dev` (no destructive/ambiguous change,
      no hand-written SQL needed).
- [ ] Add to `card.update`'s zod schema and the relevant routers, same
      shape as `dueDate` already has.
- [ ] Card detail panel: add a Start date field next to Due date in the
      metadata grid (same `Input type="date"` pattern already used for
      Due date — literally copy it).

### 6.2 — Timeline view
- [ ] New `CalendarView`-sibling component, `TimelineView.tsx`, and
      route `boards/[boardId]/timeline/page.tsx` (mirror the existing
      `calendar/page.tsx` structure exactly — same data-fetching shape,
      same `PageHeader` usage).
- [ ] Date-axis header (day or week ticks depending on range) + one row
      per card, bar positioned/sized by `startDate`↔`dueDate`.
- [ ] Cards with only a `dueDate` (the common case today, since
      `startDate` is brand new) render as a single-day marker, not a
      zero-width invisible bar — this view must be useful on day one
      without anyone having to backfill start dates.
- [ ] Click a bar/marker → opens the existing `CardDetailPanel` via the
      same `onOpenCard` mechanism every other view uses.
- [ ] Horizontal scroll for the date axis, `thin-scrollbar` styling
      (reuse the utility class already added for the board).

## Acceptance criteria

- A board with only due dates set (no start dates backfilled) still
  renders a useful timeline — this can't require data migration to be
  useful.
- A card with both start and due date renders a bar spanning exactly
  that range on the axis.
- Clicking any bar/marker opens the correct card.
- `tsc` / `lint` / `test` / `build` clean. Playwright check: board with a
  mix of start+due, due-only, and no-date cards; confirm the due-only
  and start+due cases both render sensibly and no-date cards are simply
  excluded from the timeline (not shown as broken/zero-position bars).
