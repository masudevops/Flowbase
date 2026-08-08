-- ------------------------------------------------------------
-- Invite-by-token lookup
--
-- Someone redeeming an invite link isn't a member of the org yet, so the
-- normal RLS-scoped path can't SELECT the invite row (tenant_isolation on
-- invites requires organization_id = any(current_org_ids())) — and they
-- may not even be logged in yet, so app.current_user_id() could be null
-- too. Token possession is the authorization here, the same trust model
-- as a password reset link, so this is a SECURITY DEFINER function (same
-- pattern as app.current_user_id()/app.current_org_ids() in
-- 001_helper_functions.sql) that runs as its owner and bypasses RLS on
-- invites/organizations for this one narrow, token-scoped read.
-- ------------------------------------------------------------

create or replace function app.get_invite_by_token(p_token text)
returns table (
  id text,
  organization_id text,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.organization_id, o.name, o.slug, i.email, i.role::text, i.status::text, i.expires_at
  from invites i
  join organizations o on o.id = i.organization_id
  where i.token = p_token
$$;

revoke execute on function app.get_invite_by_token(text) from public;
grant execute on function app.get_invite_by_token(text) to app_user, authenticated;
