-- ------------------------------------------------------------
-- Custom fields — standard tenant isolation, same pattern as every
-- other table. organization_id is denormalized onto both tables
-- specifically so this stays a single-column check.
-- ------------------------------------------------------------

alter table custom_field_definitions enable row level security;

drop policy if exists tenant_isolation on custom_field_definitions;
create policy tenant_isolation on custom_field_definitions
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

alter table custom_field_values enable row level security;

drop policy if exists tenant_isolation on custom_field_values;
create policy tenant_isolation on custom_field_values
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));
