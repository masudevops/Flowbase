# Epic 10: Rollup custom field (sum of children)

**Status:** Done — shipped and verified live
**Schema change:** Additive — one more `CustomFieldType` value, reusing
Epic 9's `formula` JSON column with a different shape
**Risk:** Low–medium — depends on Epic 9 landing first (shares the
"computed, read-only field" plumbing)

## Why

The other half of the same monday.com comparison: rollup columns that sum
a numeric field across a parent's children — the construction case is a
punch-list parent card showing total cost across every sub-task
(`parentCardId` already exists from an earlier build). This is the
natural sibling to Epic 9's Formula field (same "computed at read time,
not editable" shape), so it's ordered right after it and reuses the same
evaluator/UI conventions rather than inventing a second pattern.

## Scope

- New `CustomFieldType` value: `ROLLUP`.
- A rollup field is defined on a `CardType` and references one NUMBER (or
  FORMULA) field **definition on that same CardType**. Its value = the
  sum of that field across the card's direct children (`Card.children`)
  whose `cardTypeId` matches the parent's — children of a different type
  are skipped, not treated as an error (a mixed-type sub-task list is
  normal; the rollup just can't sum a field that doesn't exist on them).
- Only `SUM` in v1 — no average/min/max/count. Sum is the one construction
  budget rollups actually need; the others are easy additive follow-ups
  once this pattern exists.
- Card detail: same "computed, read-only" rendering Epic 9 adds to
  `CustomFieldsSection.tsx` — a rollup field is visually identical to a
  formula field from the user's side, just computed differently.

## Non-goals

- No rollups across grandchildren (only direct children) — matches how
  `parentCardId` is already a single level, not a tree-traversal
  concept anywhere else in this schema.
- No rollups over a FORMULA-type field on the children in v1 — start
  with rolling up NUMBER fields only; extending to FORMULA fields is a
  one-line follow-up once the read-path exists, but keep v1 simple to
  verify.
- Not recalculated via a background job or cached — computed live on
  read, same as Epic 9's formulas. If this ever becomes a performance
  problem (deep card trees, frequent reads), that's a real optimization
  epic on its own, not a v1 concern.

## Stories

### 10.1 — Schema
- [x] `CustomFieldDefinition.formula` (added in Epic 9) gains a second
      valid shape for `ROLLUP`: `{ sourceFieldId: string, aggregate:
      "SUM" }` — same column, discriminated by `fieldType`, not a
      separate column (keeps the "one JSON column, shape depends on
      fieldType" pattern Epic 9 already established instead of adding
      per-type columns).
- [x] Purely additive, no migration risk.

### 10.2 — Evaluator + router
- [x] `src/lib/formula.ts` (from Epic 9) gains `evaluateRollup(sourceFieldId,
      children, valuesByCardIdAndFieldId): number` — sums, treating a
      missing/non-numeric value on any given child as `0` for that child
      (not `null` for the whole rollup — a rollup with 3 of 5 children
      filled in should show the partial sum, not "—"; this is a
      deliberate difference from Formula's null-propagation, since an
      incomplete rollup is still meaningful, an incomplete formula
      usually isn't).
- [x] `customField.createDefinition`: validate the referenced
      `sourceFieldId` is a NUMBER field on the *same* `cardTypeId` as the
      rollup definition being created.
- [x] Extend whatever Epic 9 built for returning computed values to also
      fetch the card's children (with their custom field values) when
      the card's type has a ROLLUP field defined — only do this extra
      query when actually needed, not on every card read.

### 10.3 — UI
- [x] `CustomFieldsManager.tsx`: "Rollup (sum of sub-tasks)" as a field
      type option, revealing a single field-picker scoped to this card
      type's NUMBER fields.
- [x] `CustomFieldsSection.tsx`: renders like a Formula field (read-only,
      "Calculated" styling) — reuse the same component, don't fork it.

## Acceptance criteria

- A parent card with 3 same-type children, each with a `Cost` NUMBER
  field set to 100/200/300, shows a `Total Cost` rollup of 600.
- Adding a 4th child with `Cost = 50` updates the rollup to 650 the next
  time the parent is read.
- A child with no value set for `Cost` contributes 0, not an error and
  not `null`-ing the whole rollup.
- A child of a different `CardType` (no `Cost` field at all) is skipped
  silently, not counted as 0 and not erroring.
- `tsc` / `lint` / `test` / `build` clean, plus test coverage in
  `tests/formula-fields.test.ts` (or a sibling `rollup-fields.test.ts`)
  for: correct sum, missing-child-value → contributes 0, mixed-type
  children → non-matching ones skipped, empty children → rollup is 0.
