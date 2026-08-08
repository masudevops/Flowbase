-- ------------------------------------------------------------
-- Notifications
--
-- SELECT/UPDATE/DELETE are scoped to the recipient (user_id) — nobody
-- should read or mark-read someone else's notification feed. INSERT is
-- scoped to organization membership instead, because the actor who
-- triggers a notification (assigning a card, commenting) is virtually
-- never the recipient. A recipient-only INSERT policy would also hit
-- the RETURNING-requires-SELECT-policy wall documented in
-- 002_policies.sql (org bootstrap) and invite.service.ts (invite
-- accept) — except here there's no later point where the actor becomes
-- the recipient, so it's not even solvable by sequencing. Instead,
-- src/server/services/notification.service.ts's createNotification()
-- uses a raw INSERT with no RETURNING, same fix, different root cause.
-- ------------------------------------------------------------

alter table notifications enable row level security;

drop policy if exists select_own_notifications on notifications;
create policy select_own_notifications on notifications for select
  using (user_id = app.current_user_id());

drop policy if exists insert_org_notifications on notifications;
create policy insert_org_notifications on notifications for insert
  with check (organization_id = any (select app.current_org_ids()));

drop policy if exists update_own_notifications on notifications;
create policy update_own_notifications on notifications for update
  using (user_id = app.current_user_id())
  with check (user_id = app.current_user_id());

drop policy if exists delete_own_notifications on notifications;
create policy delete_own_notifications on notifications for delete
  using (user_id = app.current_user_id());

-- ------------------------------------------------------------
-- Automations — standard tenant isolation. Admin-only create/delete is
-- an app-layer check (assertAdmin), same as board deletion; RLS just
-- needs the usual org-membership boundary.
-- ------------------------------------------------------------

alter table automations enable row level security;

drop policy if exists tenant_isolation on automations;
create policy tenant_isolation on automations
  using (organization_id = any (select app.current_org_ids()))
  with check (organization_id = any (select app.current_org_ids()));
