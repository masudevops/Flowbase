# Roadmap: closing the Jira/Trello maturity gap

Source: comparison of Kelbara against trello.com/home and atlassian.com/software/jira
(2026-08-08), filtered through Kelbara's own positioning — "flexible work
management," not a Jira clone. Epics that would have pulled Kelbara toward
Jira-specific depth (sprints, configurable workflow-transition rules,
burndown/velocity dashboards) were deliberately left out; see "Explicitly
excluded" below.

Work through these in order. Each epic file has its own stories, schema
changes (if any), and acceptance criteria. Update an epic's checkboxes and
status as stories land; don't let this drift out of sync with reality.

## Order

| # | Epic | Schema change? | Risk |
|---|------|-----------------|------|
| 1 | [Card activity log](./01-card-activity-log.md) | No | Very low |
| 2 | [Card front & live board scanability](./02-card-front-scanability.md) | No | Low |
| 3 | [Blocked-by linked card](./03-blocked-by-linked-card.md) | Additive (1 FK) | Low |
| 4 | [Swimlanes](./04-swimlanes.md) | No | Low–medium |
| 5 | [Multiple assignees](./05-multiple-assignees.md) | Migration (join table) | Medium |
| 6 | [Timeline / roadmap view](./06-timeline-view.md) | Additive (1 field) | Medium |
| 7 | [Custom fields](./07-custom-fields.md) | New tables | Medium–high |

Ordered by risk/value, not strict priority — 1 and 2 are safe enough to do
back-to-back before checking in; 5–7 each touch enough surface area that
they should land, get verified, and get committed individually.

## Ground rules (carried over from the rest of this project)

- Smallest clean change that solves the story. No speculative abstraction.
- Preserve existing data and functionality — additive migrations only,
  backfill scripts for anything that touches existing rows.
- Don't weaken RLS. Every new tenant-scoped table gets the same
  `organization_id`-denormalized policy as everything else.
- Match the existing design system — no new visual language, reuse
  `src/components/ui/*` primitives.
- `tsc` / `lint` / `test` / `build` clean before calling a story done.
  Live Playwright verification for anything user-facing.
- Commit as a checkpoint after each epic (or each story, for the bigger
  epics). Don't push without being asked.

## Explicitly excluded (for now)

- **Sprints/cycles** — Jira's core loop for dev teams, but it fights
  Kelbara's multi-vertical pitch (construction/ops/marketing teams don't
  think in sprints). This is a positioning decision, not a build — raise
  it separately if we want to compete harder for dev teams specifically.
- **Configurable workflow-transition rules** (e.g. "can't move to Done
  until checklist is complete") — real Jira depth, real complexity, thin
  audience fit today.
- **Dashboards/reports** (burndown, cumulative flow, velocity) — same
  reasoning; revisit once there's a concrete team asking for it.
- Illustrated empty states, board backgrounds, JQL-style query language —
  cut against Kelbara's restrained, simple direction on purpose.
