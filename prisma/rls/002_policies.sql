-- ------------------------------------------------------------
-- Row-Level Security policies
--
-- Every tenant-scoped table carries organization_id directly, so every
-- policy below is a simple single-table check against
-- app.current_org_ids() — no cross-table joins needed at policy-eval time.
--
-- Idempotent (DROP POLICY IF EXISTS before every CREATE POLICY) so this
-- file can be safely re-run — see prisma/rls/apply.ts.
--
-- Apply after `prisma migrate deploy` (Prisma has no native RLS support,
-- so this lives as raw SQL run out-of-band). See prisma/rls/README.md.
-- ------------------------------------------------------------

alter table organizations enable row level security;
alter table memberships enable row level security;
alter table invites enable row level security;
alter table workspace_module_settings enable row level security;
alter table boards enable row level security;
alter table columns enable row level security;
alter table card_types enable row level security;
alter table labels enable row level security;
alter table cards enable row level security;
alter table card_labels enable row level security;
alter table comments enable row level security;
alter table checklist_items enable row level security;
alter table audit_logs enable row level security;

-- organizations and memberships are split into per-command policies
-- instead of one blanket USING+WITH CHECK. Creating a brand-new org (and
-- its first ADMIN membership, in the same transaction) is a bootstrap
-- case: at INSERT time, the membership that would grant access via
-- app.current_org_ids() doesn't exist yet. A blanket policy would block
-- org creation entirely. Since there's no existing tenant boundary being
-- crossed when *creating* a new org, INSERT is intentionally permissive
-- (any authenticated app_user session may create one); reads/updates/
-- deletes remain scoped to orgs the user already belongs to.
drop policy if exists select_own_orgs on organizations;
create policy select_own_orgs on organizations for select
  using (id = any (select app.current_org_ids()));

drop policy if exists insert_org on organizations;
create policy insert_org on organizations for insert
  with check (app.current_user_id() is not null);

drop policy if exists update_own_orgs on organizations;
create policy update_own_orgs on organizations for update
  using (id = any (select app.current_org_ids()))
  with check (id = any (select app.current_org_ids()));

drop policy if exists delete_own_orgs on organizations;
create policy delete_own_orgs on organizations for delete
  using (id = any (select app.current_org_ids()));

-- memberships has the same bootstrap problem, plus a second legitimate
-- self-insert case: accepting an Invite (the invited user creates their
-- own membership row; admins never insert a membership row on someone
-- else's behalf — they create an Invite instead, see the invites policy
-- below). So INSERT is allowed only when the new row's user_id is the
-- caller's own id; SELECT/UPDATE/DELETE remain tenant-scoped.
drop policy if exists select_own_org_memberships on memberships;
create policy select_own_org_memberships on memberships for select
  using (organization_id = any (select app.current_org_ids()));

drop policy if exists insert_own_membership on memberships;
create policy insert_own_membership on memberships for insert
  with check (user_id = app.current_user_id());

drop policy if exists update_own_org_memberships on memberships;
create policy update_own_org_memberships on memberships for update
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists delete_own_org_memberships on memberships;
create policy delete_own_org_memberships on memberships for delete
  using (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on invites;
create policy tenant_isolation on invites
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on workspace_module_settings;
create policy tenant_isolation on workspace_module_settings
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on boards;
create policy tenant_isolation on boards
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on columns;
create policy tenant_isolation on columns
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on card_types;
create policy tenant_isolation on card_types
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on labels;
create policy tenant_isolation on labels
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on cards;
create policy tenant_isolation on cards
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

-- card_labels has no organization_id of its own (pure join table) —
-- scope through the parent card instead.
drop policy if exists tenant_isolation on card_labels;
create policy tenant_isolation on card_labels
  using (
    exists (
      select 1 from cards
      where cards.id = card_labels.card_id
        and cards.organization_id = any (select app.current_org_ids())
    )
  )
  with check (
    exists (
      select 1 from cards
      where cards.id = card_labels.card_id
        and cards.organization_id = any (select app.current_org_ids())
    )
  );

drop policy if exists tenant_isolation on comments;
create policy tenant_isolation on comments
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists tenant_isolation on checklist_items;
create policy tenant_isolation on checklist_items
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

-- audit_logs: read-only from the app's perspective (writes go through
-- audit.service.ts using the same app_user role, so INSERT still needs
-- to pass the WITH CHECK below).
drop policy if exists tenant_isolation on audit_logs;
create policy tenant_isolation on audit_logs
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));

-- users table intentionally has NO RLS enabled: it holds no
-- organization_id (a user can belong to multiple orgs) and only
-- non-sensitive profile fields (id, email, name, avatar). Membership rows
-- are what's tenant-scoped; user profile lookups (e.g. rendering an
-- assignee's name) are fine to allow broadly. Revisit if profile fields
-- become sensitive.
