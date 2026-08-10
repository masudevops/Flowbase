-- ------------------------------------------------------------
-- Invite lookup by email / by id
--
-- /onboarding needs to show "Join Acme Construction" to a signed-in user
-- who has a pending invite, even when the invite token didn't survive
-- the signup/login redirect chain (e.g. they navigated away from the
-- emailed link and came back in cold). That user isn't a member of the
-- inviting org yet, so — same reasoning as
-- app.get_invite_by_token in 005_invite_lookup.sql — the normal
-- RLS-scoped path can't SELECT those invite rows. Two SECURITY DEFINER
-- functions, same trust model: get_invites_by_email is only ever called
-- with the caller's OWN verified email (never user-suppliable), and
-- get_invite_by_id backs the accept-by-id path the same way
-- get_invite_by_token backs accept-by-token.
-- ------------------------------------------------------------

create or replace function app.get_invites_by_email(p_email text)
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
  where lower(i.email) = lower(p_email)
    and i.status = 'INVITED'
    and i.expires_at > now()
  order by i.created_at desc
$$;

revoke execute on function app.get_invites_by_email(text) from public;
grant execute on function app.get_invites_by_email(text) to app_user, authenticated;

create or replace function app.get_invite_by_id(p_id text)
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
  where i.id = p_id
$$;

revoke execute on function app.get_invite_by_id(text) from public;
grant execute on function app.get_invite_by_id(text) to app_user, authenticated;
