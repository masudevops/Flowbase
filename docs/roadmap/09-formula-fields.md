# Epic 9: Formula custom field

**Status:** Done — shipped and verified live
**Schema change:** Additive — one new column + one new enum value on the
existing `CustomFieldDefinition`/`CustomFieldType`
**Risk:** Low–medium — no new tables, but the evaluator is
correctness-sensitive

## Why

Pulled from a monday.com feature-comparison pass: their most-used "Power-Up"
column is the Formula Column — computing one field from others (classic
construction case: `Quantity × Unit Cost` for a running budget line). Epic 7
already has the field-definition infrastructure (per-CardType fields,
TEXT/NUMBER/SELECT); Formula is an additive 4th `fieldType`, not a new
subsystem.

## Scope

- New `CustomFieldType` enum value: `FORMULA`.
- A formula references exactly **two** sibling fields on the same
  `CardType` (or one sibling field and a constant) combined with one
  operator: `+ - * /`. No general expression language, no referencing
  fields across card types, no referencing another formula field
  (chained formulas add real complexity — cyclic-reference detection —
  for a v1 use case that doesn't need it).
- A formula field's value is **computed at read time**, not stored in
  `CustomFieldValue` — it always reflects the current value of the
  fields it references, and never goes stale the way a cached computed
  value could.
- Board settings (`CustomFieldsManager.tsx`): picking "Formula" as the
  field type reveals two field-pickers (scoped to this card type's
  existing NUMBER fields) + an operator dropdown, instead of the
  name/options inputs TEXT/SELECT use.
- Card detail (`CustomFieldsSection.tsx`): a formula field renders
  read-only (no `FieldInput` — there's nothing to edit), styled visibly
  different from an editable field so it doesn't look broken.

## Non-goals

- No arbitrary expression language, no `eval`/`Function` — the evaluator
  is a small hand-written switch over the 4 operators on 2 numbers, so
  there's no code-injection surface even in principle (this matters more
  than it might seem: formula definitions are admin-authored data that
  gets evaluated on every card read).
- No formula chaining (a formula referencing another formula field).
- No cross-card-type formulas — both referenced fields must belong to the
  same `CardType` as the formula field itself.
- Not shown on the card front or Backlog table in v1 — same reasoning as
  Epic 7's non-goals (avoid cluttering the card front; a natural
  fast-follow once validated as useful).

## Stories

### 9.1 — Schema
- [x] `enum CustomFieldType { TEXT NUMBER SELECT FORMULA }`.
- [x] `CustomFieldDefinition.formula Json?` — shape:
      `{ leftFieldId: string, operator: "+" | "-" | "*" | "/", right:
      { type: "field", fieldId: string } | { type: "constant", value:
      number } }`. Null for TEXT/NUMBER/SELECT, required for FORMULA
      (validate in the zod schema, not just at the DB layer).
- [x] Purely additive — `prisma migrate dev` should apply cleanly.

### 9.2 — Evaluator + router
- [x] `src/lib/formula.ts`: `evaluateFormula(formula, valuesByFieldId):
      number | null` — returns `null` (not a crash, not zero) if a
      referenced field's value is missing or non-numeric, so an
      incomplete card just shows "—" instead of a misleading `0`.
      Divide-by-zero returns `null` too, not `Infinity`/`NaN`.
- [x] `customField.createDefinition`: when `fieldType === "FORMULA"`,
      validate both referenced fields exist, belong to the same
      `cardTypeId`, and are `NUMBER` type — reject otherwise with a
      clear `BAD_REQUEST`.
- [x] `customField.listValues` (or a new `computedValues` alongside it):
      for each FORMULA definition on the card's type, compute and
      return its value using the card's current NUMBER-field values —
      don't make the client re-implement the evaluator.

### 9.3 — UI
- [x] `CustomFieldsManager.tsx`: Formula option in the field-type
      dropdown; when selected, two `Select`s scoped to this card type's
      existing NUMBER fields (right side can toggle to a plain number
      input for a constant) + an operator `Select`.
- [x] `CustomFieldsSection.tsx`: a FORMULA definition renders its
      computed value in a disabled-looking `Input` (or plain text) —
      visibly read-only, with a small icon/label ("Calculated") so it
      doesn't read as a broken editable field.

## Acceptance criteria

- Defining `Total = Quantity * Unit Cost` and setting Quantity=4,
  Unit Cost=25 on a card shows Total=100, live, without a page reload.
- Changing Quantity to 5 updates Total to 125 the next time the card is
  read — no stale cached value anywhere.
- A card missing either referenced field's value shows the formula
  field as "—", not `0` or a crash.
- Attempting to create a formula referencing a field from a different
  card type, or a non-NUMBER field, is rejected server-side (not just
  hidden client-side).
- `tsc` / `lint` / `test` / `build` clean, plus `tests/formula-fields.test.ts`
  covering: correct computation, missing-value → null, divide-by-zero →
  null, cross-card-type rejection, non-NUMBER-field rejection.
