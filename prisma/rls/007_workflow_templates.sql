-- ------------------------------------------------------------
-- Workflow templates — standard tenant isolation, same pattern as every
-- other table. Nothing special here: organization_id is denormalized
-- onto all three tables specifically so this stays a single-pattern
-- check instead of a join through workflow_templates.
-- ------------------------------------------------------------

alter table workflow_templates enable row level security;
alter table workflow_template_columns enable row level security;
alter table workflow_template_card_types enable row level security;

drop policy if exists tenant_isolation on workflow_templates;
create policy tenant_isolation on workflow_templates
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on workflow_template_columns;
create policy tenant_isolation on workflow_template_columns
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on workflow_template_card_types;
create policy tenant_isolation on workflow_template_card_types
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));
