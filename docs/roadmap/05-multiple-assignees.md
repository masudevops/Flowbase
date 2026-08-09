# Epic 5: Multiple assignees

**Status:** Not started
**Schema change:** Migration — new join table, existing `assigneeId`/
`assigneeContactId` columns become derived/legacy
**Risk:** Medium — touches card front, detail panel, My Work, Backlog,
filters, and notifications. Not risky *technically* (additive + backfill,
same playbook as the Build #1 CardType-scoping migration), just wide.

## Why

Both competitors support more than one person on a work item. Kelbara's
`Card.assigneeId` is a single nullable FK (plus a separate, mutually-
exclusive `assigneeContactId` for external contacts). Real teams routinely
have a primary owner plus one or two collaborators on the same card.

## Scope

- A `CardAssignee` join table supporting both registered members and
  external contacts (mirrors the existing "member OR contact, never
  both" rule per row, enforced at the service layer like today).
- Card detail: multi-select assignee picker instead of a single dropdown.
- Card front: avatar stack, max 3 shown + "+N" overflow indicator.
- My Work / Backlog / notifications: "assigned to me" becomes "I'm one of
  the assignees," not "I'm the sole assignee."

## Non-goals

- No per-assignee role distinction (e.g. "owner" vs "watcher") — every
  assignee is equal for v1. That's a real future feature if teams ask
  for it, not bundled in here.
- Not removing the existing single-assignee columns in this epic —
  deprecate them (stop writing to them, same pattern as
  `Board.templateKey` going legacy in the workflow-templates build), keep
  them for one release cycle before a follow-up epic drops them.

## Stories

### 5.1 — Schema + backfill
- [ ] New model, following the exact `organizationId`-denormalized RLS
      pattern every other tenant table uses:
      ```prisma
      model CardAssignee {
        id             String  @id @default(cuid())
        organizationId String  @map("organization_id")
        cardId         String  @map("card_id")
        userId         String? @map("user_id")
        contactId      String? @map("contact_id")

        card    Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
        user    User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
        contact Contact? @relation(fields: [contactId], references: [id], onDelete: Cascade)

        @@unique([cardId, userId])
        @@unique([cardId, contactId])
        @@index([organizationId])
        @@index([cardId])
        @@map("card_assignees")
      }
      ```
- [ ] `prisma/rls/00X_card_assignees.sql` — standard `tenant_isolation`
      policy, registered in `prisma/rls/apply.ts`'s file list (copy the
      pattern from `007_workflow_templates.sql` exactly).
- [ ] `prisma/backfill-card-assignees.ts` — one-time idempotent script,
      superuser connection, inserts one `CardAssignee` row per existing
      non-null `assigneeId`/`assigneeContactId`. Added to `package.json`
      as `db:backfill-card-assignees`. Verify afterward: every card that
      had an assignee before has exactly one `CardAssignee` row after,
      zero orphans.
- [ ] Keep `Card.assigneeId`/`assigneeContactId` columns in place but
      stop writing to them going forward (mark legacy in a schema
      comment, same as `templateKey`) — do not drop them in this epic.

### 5.2 — Service + router
- [ ] `card.service.ts`: replace single-assignee set logic with a
      `setCardAssignees(cardId, assignees: {userId?: string,
      contactId?: string}[])` that diffs against current rows (add
      missing, remove extras) inside the existing RLS transaction.
- [ ] `card.byId` / `card.listByBoard` / `card.listAssignedToMe`:
      include `assignees` (user + contact relations) instead of the old
      single `assignee`/`assigneeContact`.
- [ ] `listAssignedToMe` filters on "current user is IN assignees," not
      "current user IS the assignee."
- [ ] Notification triggers (assignment emails) fire once per newly-
      added assignee, not once per card update.

### 5.3 — UI
- [ ] `CardDetailPanel.tsx`: replace the single `Select` with a multi-
      select (checkbox list styled consistently with the existing
      Labels picker — that's already a "toggle membership in a set"
      pattern in this exact file, reuse its visual treatment rather
      than inventing a new multi-select component).
- [ ] `CardPreview.tsx`: avatar stack — overlapping circles, max 3 +
      "+N," replacing the single avatar.
- [ ] `BacklogView.tsx` / `MyWorkView.tsx`: assignee column/filter
      updated for the new shape; "Unassigned" still means zero
      assignees.

## Acceptance criteria

- Every card that had a single assignee before the migration shows
  exactly that one person as its assignee after — no data loss, no
  duplicates.
- A card can have 0, 1, or several assignees; My Work correctly lists a
  card for every one of its assignees, not just a "primary" one.
- Card front avatar stack never overflows the card's layout regardless
  of assignee count.
- `tsc` / `lint` / `test` / `build` clean, existing `card-mutations.test.ts`
  assignee assertions updated (not just left broken) plus a new test for
  multi-assignee set/unset and the "assigned to me" filter with 2+
  assignees.
