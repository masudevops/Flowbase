# Epic 4: Swimlanes

**Status:** Done — shipped and verified live
**Schema change:** None
**Risk:** Low–medium (mostly UI layout complexity, not data risk)

## Why

Grouping a column's cards into horizontal bands (by assignee, priority,
or card type) is one of the fastest ways a Kanban tool reads as "mature" —
Jira's board does this natively. It's also pure presentation: no new
entity, no new relation, nothing to migrate. The existing `columns[].cards`
data already has everything needed to group by.

## Scope

- A "Group by" control in the board toolbar: None (current behavior) /
  Assignee / Priority / Type.
- When grouped, each column renders its cards split into labeled bands
  instead of one flat list, ordered consistently across all columns
  (e.g. same assignee order in every column) so it reads as a grid.
- Drag-and-drop still works within and across swimlanes — dropping a
  card into a different assignee's band does NOT reassign it (swimlanes
  are a view, not an edit action — reassigning stays an explicit action
  in the card detail panel, per the same "moving a card doesn't silently
  change unrelated fields" principle the blocked-column auto-flag
  already follows carefully).

## Non-goals

- No custom/user-defined swimlane grouping beyond the three above.
- No collapsing/hiding individual swimlanes (could be a fast-follow if
  boards get large, not needed for v1).
- Not persisting the grouping choice server-side — a per-session/
  localStorage preference is enough for v1 (see 4.2).

## Stories

### 4.1 — Grouping logic + rendering
- [ ] `Board.tsx`: derive swimlane groups from the existing `columns`
      state (`groupBy: "none" | "assignee" | "priority" | "type"`) —
      pure client-side derivation, no new query.
- [ ] `Column.tsx`: accept the active grouping and render either the
      current flat `SortableContext` (groupBy = none, unchanged
      behavior) or one `SortableContext` per swimlane band stacked
      vertically with a small band label.
- [ ] Swimlane band order must be identical across all columns (e.g.
      alphabetical by assignee name, with "Unassigned" always last) so
      the board still reads as a grid, not independently-shuffled
      columns.
- [ ] Cross-swimlane, cross-column drag: card moves columns as normal;
      its assignee/priority/type is untouched by the move.

### 4.2 — Toolbar control + persistence
- [ ] Small `Select` in the board toolbar (next to Backlog/Calendar/
      Manage columns), using the `Select` primitive.
- [ ] Persist the choice in `localStorage` per board id (same lightweight
      pattern as the theme toggle — no backend round-trip needed for a
      view preference).

## Acceptance criteria

- Switching "Group by" reorganizes every column into the same band
  structure without a page reload or query refetch.
- Dragging a card between swimlanes/columns updates its column
  (position) exactly as before and does NOT change its assignee,
  priority, or type as a side effect.
- Reloading the board remembers the last-used grouping for that board.
- Existing (ungrouped) behavior is pixel-identical to today when "Group
  by: None" is selected — this must not regress the current board.
- `tsc` / `lint` / `test` / `build` clean. Playwright check: group by
  assignee on a board with cards assigned to 2+ people plus unassigned
  cards, confirm bands render correctly and a drag between columns
  doesn't touch the assignee field.
