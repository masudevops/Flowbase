# Epic 7: Custom fields

**Status:** Not started
**Schema change:** New tables
**Risk:** Medium–high — biggest epic in this roadmap, touches the card
detail panel, board settings, Backlog table, and card creation.

## Why

Jira's biggest actual flexibility lever is user-definable fields per
issue type — and arguably this is *more* on-brand for Kelbara than most
Jira features, since "define the fields that matter for how your team
works" is a literal expression of "Work, shaped to fit." A construction
board might want "Permit number"; a marketing board might want
"Campaign." Fixed fields can't express that; this can, without Kelbara
having to guess every vertical's vocabulary up front.

## Scope

- Field definitions scoped per **CardType** (not per-board globally) —
  consistent with the fact that CardType is already the board-scoped
  customization unit (per the Build #1 CardType-scoping work). A "Bug"
  type and a "Feature" type on the same board can have different custom
  fields.
- Field types for v1: **text**, **number**, **single-select** (with
  admin-defined options). No date/checkbox/multi-select in v1 — keep the
  type system small; expand only if the three basics turn out to be
  insufficient in practice.
- Board settings: admins define custom fields per card type (name, type,
  options-if-select).
- Card detail: custom field values render in the metadata tier, grouped
  after the fixed fields, only when the card's type has any defined.

## Non-goals

- No custom fields on boards/columns/organizations — cards only, for v1.
- No formula/computed fields, no field-level permissions, no required-
  field validation — all real Jira-admin-console depth this doesn't need
  yet.
- Not shown on the card front or Backlog table in v1 (that's a natural
  fast-follow once the core feature is validated as useful — don't
  bundle it in and risk a cluttered card front for boards using several
  custom fields).

## Stories

### 7.1 — Schema
- [ ] `CustomFieldDefinition`: `id, organizationId, cardTypeId, name,
      fieldType (TEXT | NUMBER | SELECT), options (Json?, only for
      SELECT), position, createdAt`. Standard `organizationId`-
      denormalized RLS pattern, `@@index([cardTypeId])`.
- [ ] `CustomFieldValue`: `id, organizationId, cardId, fieldDefinitionId,
      value (String?)` — store everything as string, parse/format by
      `fieldType` at the UI layer (keeps the table simple; avoids a
      polymorphic-column mess for 3 field types). `@@unique([cardId,
      fieldDefinitionId])`.
- [ ] `prisma/rls/00X_custom_fields.sql` for both new tables, registered
      in `apply.ts` the same way every prior RLS file has been.
- [ ] `onDelete: Cascade` from `CardType` → `CustomFieldDefinition` and
      from `Card`/`CustomFieldDefinition` → `CustomFieldValue` — deleting
      a card type or a field definition cleans up after itself, matching
      how every other board-scoped entity in this schema already
      cascades.

### 7.2 — Board settings: define fields
- [ ] Extend `CardTypesManager.tsx` (or a new sibling section in board
      settings) — per card type, a small list of custom fields with
      add/edit/delete, following the exact list-row pattern
      `ColumnsManager.tsx`/`CardTypesManager.tsx` already use (don't
      invent new list-editing UX for this).
- [ ] SELECT-type fields: an inline options editor (comma-separated or
      tag-style input — keep it simple, this is an admin-only, low-
      frequency screen).

### 7.3 — Card detail: fill in values
- [ ] `CardDetailPanel.tsx`: after fetching the card, look up its type's
      field definitions + this card's existing values, render one row
      per definition using `Input`/`Select` as appropriate to
      `fieldType`, positioned after the fixed metadata fields, only
      when `cardTypeId` is set and has ≥1 definition (a card with no
      type, or a type with no custom fields defined, shows nothing extra
      — no empty-section clutter).
- [ ] Autosave on blur, same pattern as every other field in this panel
      (Location, Blocked reason, etc.) — no separate "save" button.

## Acceptance criteria

- Defining a custom field on one card type doesn't affect any other
  card type, even on the same board (mirrors CardType's existing
  per-board isolation).
- Changing a card's type after it already has custom field values
  doesn't delete those values (they just stop being shown — Kelbara
  doesn't guess at cleanup here, matches the "preserve existing data"
  principle used throughout).
- A SELECT field only accepts one of its defined options; a NUMBER
  field rejects non-numeric input at the UI layer.
- `tsc` / `lint` / `test` / `build` clean, plus a new
  `tests/custom-fields.test.ts` covering tenant isolation for both new
  tables (same shape as `cardtype-scoping.test.ts`) and basic value
  set/read.
