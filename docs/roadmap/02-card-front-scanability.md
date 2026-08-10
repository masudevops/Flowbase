# Epic 2: Card front & live board scanability

**Status:** Done — shipped and verified live
**Schema change:** None
**Risk:** Low

## Why

Trello always shows the due date as a badge on the card face — Kelbara's
`CardPreview.tsx` doesn't show it at all today, only in the detail panel
and My Work. And Trello lets you filter the *live board*, not just the
Backlog table — Kelbara's board has zero filtering; you have to leave the
Kanban view and go to Backlog to narrow anything down. Both are real,
visible gaps against both competitors, and both are pure frontend —
`Card.dueDate` and all the filterable fields already exist and are
already fetched by `Board.tsx`.

## Scope

- Due date badge on `CardPreview`, color-coded the same way My Work
  already does it (overdue = red, due soon = default, no color-abuse —
  reuse the exact logic from `MyWorkView.tsx`'s `isOverdue`, don't
  reinvent it).
- A lightweight filter bar above the board's columns: assignee, card
  type, priority, "blocked only" — client-side filtering of the already-
  loaded `columns` state, no new query. Reuse the `Select`/`Checkbox`
  primitives and the same filter-state pattern already in
  `BacklogView.tsx`.

## Non-goals

- No saved/named filters (that's a bigger feature — could be a future
  story if this turns out to be wanted).
- No filter persistence across page loads.
- Not touching the Backlog page's own filters — this is additive to the
  board view specifically.

## Stories

### 2.1 — Due date badge on card front
- [ ] `CardPreview.tsx`: render a `Calendar` icon + formatted date next
      to priority, only when `card.dueDate` is set (progressive
      disclosure — same as every other optional field on the card
      already).
- [ ] Overdue → red text (`#DE350B` / `#FF5630`), matching My Work.
      Not overdue → neutral gray, matching every other metadata label on
      the card.
- [ ] Verify: a card due yesterday shows red; a card due next week shows
      neutral; a card with no due date shows nothing extra (no layout
      shift/placeholder).

### 2.2 — Live board filter bar
- [ ] New `BoardFilterBar` component (or inline in `Board.tsx` if it
      stays small — don't force a separate file for ~40 lines).
- [ ] Filters: assignee (`Select`), card type (`Select`), priority
      (`Select`), blocked-only (`Checkbox`) — same options shape as
      `BacklogView.tsx` already uses.
- [ ] Filtering narrows `columns[].cards` for rendering only — doesn't
      mutate the underlying state used by drag-and-drop, so a filtered-
      out card doesn't get corrupted position data if the user clears
      the filter mid-session.
- [ ] Column counts in the header (`BACKLOG 3`) should reflect the
      *filtered* count while a filter is active, otherwise the number is
      actively misleading.
- [ ] Empty state per column when a filter hides all its cards: keep the
      existing "Add card" affordance visible (don't imply the column is
      actually empty).

## Acceptance criteria

- Board cards show due dates exactly where My Work would flag them
  overdue, with the same color semantics.
- Filtering the board by assignee/type/priority/blocked hides non-
  matching cards in every column simultaneously, updates the counts,
  and drag-and-drop still works correctly on the filtered subset.
- Clearing all filters restores the exact original board state.
- `tsc` / `lint` / `test` / `build` clean. Playwright check: filter to
  "blocked only" on a board with a mix of cards, confirm only blocked
  cards remain visible and counts match.
