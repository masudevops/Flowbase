# Epic 11: Progress bars & a simple board-progress chart

**Status:** Not started
**Schema change:** No
**Risk:** Very low — pure rendering on top of data every surface already
fetches; no new queries, no new tables

## Why

Requested directly: "an easy to implement chart and progress for a
task/board." This is deliberately **not** a reversal of the roadmap's
earlier "Explicitly excluded: Dashboards/reports (burndown, cumulative
flow, velocity)" call — those need time-series data collection this
schema doesn't have. This epic is a current-state snapshot only (what's
true right now, not a trend over time), which is a meaningfully smaller
and cheaper thing. Worth saying explicitly so it doesn't read as
quietly re-opening that earlier decision.

## Scope

- **Task-level progress bar**: `CardPreview.tsx` already computes
  `checklistDone`/`checklistTotal` and `childrenDone`/`childrenTotal` and
  renders them as plain text ("3/5") — add a thin visual progress bar
  under that text using the same numbers. No new data fetching.
- **Board-level progress chart**: a small summary at the top of the board
  view (`Board.tsx`) — count of cards per column (or done vs. not-done)
  rendered as a horizontal stacked bar, using `columns`/`cards` data the
  board page already has server-rendered. Click a segment → filters the
  board to that column/status (reuses the existing `BoardFilterBar`
  state, doesn't need new filter logic).
- Plain CSS/divs for both — no charting library dependency. A stacked bar
  is a handful of `<div>`s with `width: %` and background colors from the
  existing palette; nothing here needs SVG or a canvas library.

## Non-goals

- No time-series/trend charts (burndown, velocity, cumulative flow) —
  still excluded, for the reason stated in the roadmap README.
- No configurable chart types, no chart builder — one fixed
  presentation (stacked bar) for v1.
- Not on the Dashboard page (org-level, across boards) in v1 — scoped to
  a single board's own page first; an org-wide rollup is a natural
  follow-up once this pattern is validated on one board.

## Stories

### 11.1 — Task-level progress bar
- [ ] `CardPreview.tsx`: replace (or augment) the `{checklistDone}/{checklistTotal}`
      text with a 2-3px-tall bar (`width: ${done/total * 100}%`) in the
      existing blueprint-blue accent, same treatment for the sub-tasks
      count. Keep the text too — a bar alone doesn't convey the exact
      numbers, and the existing card-front information density
      guidelines (Epic 2) favor scannable exact counts over ambiguous
      visuals alone.
- [ ] Verify it doesn't regress the card-front layout at the narrow end
      of the existing card width — check with a card that has both a
      checklist AND sub-tasks AND is in a grouped swimlane band (the
      most visually crowded case that already exists).

### 11.2 — Board-level progress chart
- [ ] New small component, `BoardProgressBar.tsx`, rendered in `Board.tsx`
      above the columns (below the existing filter row) — a single
      horizontal stacked bar segmented by column, each segment's width
      proportional to that column's card count, colored consistently
      with existing column/priority conventions (done columns in the
      established green, blocked-flagged cards' proportion called out
      separately if easy, skip if it complicates the v1 data shape).
- [ ] Clicking a segment sets the board's existing type/priority/assignee
      filter state to isolate that column's cards — actually, simplest
      correct behavior: clicking scrolls to / highlights that column
      rather than filtering (filtering by column isn't a concept the
      existing `BoardFilters` type has, and cards already visually group
      by column — don't invent a new filter dimension just for this).
- [ ] Respects the board's current filter state — if filters are active,
      the chart reflects the filtered count, not the whole board's, so
      it never contradicts what's visible below it.

## Acceptance criteria

- A card with a 3/5-complete checklist shows a bar visibly ~60% filled,
  updates live when a checklist item is toggled (no page reload).
- The board progress bar's segment widths sum to the total visible card
  count and stay in sync with the existing column headers' counts.
- Toggling an existing board filter updates the progress bar to match
  filtered cards, not the whole board.
- No new tRPC queries added — both features render from data the board
  page and `CardPreview` already fetch.
- `tsc` / `lint` / `test` / `build` clean. Live Playwright verification:
  toggle a checklist item and confirm the card-front bar updates; apply
  a board filter and confirm the board-level bar updates to match.
