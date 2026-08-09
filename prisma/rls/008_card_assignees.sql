-- ------------------------------------------------------------
-- Card assignees — standard tenant isolation, same pattern as every
-- other table. organization_id is denormalized onto card_assignees
-- specifically so this stays a single-column check instead of a join
-- through cards.
-- ------------------------------------------------------------

alter table card_assignees enable row level security;

drop policy if exists tenant_isolation on card_assignees;
create policy tenant_isolation on card_assignees
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));
