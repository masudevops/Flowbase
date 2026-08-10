# Roadmap: closing the Jira/Trello maturity gap

Source: comparison of Kelbara against trello.com/home and atlassian.com/software/jira
(2026-08-08), filtered through Kelbara's own positioning — "flexible work
management," not a Jira clone. Epics that would have pulled Kelbara toward
Jira-specific depth (sprints, configurable workflow-transition rules,
burndown/velocity dashboards) were deliberately left out; see "Explicitly
excluded" below.

Epics 9–11 (2026-08-09) come from a second comparison pass against
monday.com, specifically for the Construction/general-project-category
templates (the Software template's gap was already closed by 1–7's
Jira-informed work) — same filtering discipline: monday.com's Formula
Column and rollups are on-brand and cheap; their Dashboards feature is
explicitly not adopted here (see "Explicitly excluded").

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
| 8 | [Reliability & security hardening](./08-reliability-hardening.md) | No | Low–medium |
| 9 | [Formula custom field](./09-formula-fields.md) | Additive (1 column + 1 enum value) | Low–medium |
| 10 | [Rollup custom field](./10-rollup-fields.md) | Additive (reuses Epic 9's column) | Low–medium |
| 11 | [Progress bars & board-progress chart](./11-progress-and-charts.md) | No | Very low |
| 12 | [Auth & invite flow audit](./12-auth-invite-flow-audit.md) | No | Low |

Ordered by risk/value, not strict priority — 1 and 2 are safe enough to do
back-to-back before checking in; 5–7 each touch enough surface area that
they should land, get verified, and get committed individually.

Epic 8 is a different category from 1–7 — it's not feature-parity work
against Jira/Trello, it's closing operational gaps (a known bug, no rate
limiting, no error monitoring, undocumented backup posture) raised during
a reliability review. Two of its four stories need a new free-tier
external account before they can be built — see that epic's stories for
what to confirm first.

Epic 10 depends on Epic 9 (reuses its evaluator and computed-field UI
conventions) — don't start 10 before 9 lands. Epic 11 has no dependency
on 9/10 and is the cheapest of the three — reasonable to build first if
sequencing by effort rather than by this list's order.

Epic 12 is a different category again — not feature work like 1–7/9–11,
not operational hardening like 8. It's a correctness audit of the
signup/login/invite/join pipeline, prompted by a real bug (invite-email
links resolving to the Vercel deployment domain instead of
`kelbara.com`). Its first story is root-caused already; the fix needs a
Vercel dashboard change outside this repo before the rest of the epic's
live-verification stories can close.

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
  reasoning; revisit once there's a concrete team asking for it. Still
  excluded as of Epic 11 (2026-08-09) — Epic 11's board-progress bar is
  a current-state snapshot with no time-series data, deliberately not a
  reversal of this call; see that epic's "Why" for the distinction.
- Illustrated empty states, board backgrounds, JQL-style query language —
  cut against Kelbara's restrained, simple direction on purpose.
