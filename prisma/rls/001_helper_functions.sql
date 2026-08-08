-- ------------------------------------------------------------
-- RLS helper functions
--
-- Two different connection paths need to resolve "who is the current
-- user" for RLS:
--
-- 1. Prisma (app_user role, via DATABASE_URL) connects directly to
--    Postgres — Supabase's auth.uid() is NOT automatically populated
--    there. The app bridges this by setting a transaction-local session
--    variable before every query (see src/server/rls.ts ->
--    withRlsContext).
-- 2. The Supabase client used directly from the browser (Realtime
--    subscriptions today; Storage later) connects as Supabase's own
--    `authenticated` role with a real JWT, where auth.uid() IS populated
--    natively — but request.jwt.claim.sub never gets set for that path.
--
-- app.current_user_id() checks both, so every RLS policy in
-- 002_policies.sql works correctly regardless of which path a given
-- query came through, with no per-policy duplication.
--
-- Calling auth.uid() requires USAGE on schema `auth`. On Supabase, the
-- `postgres` role has that USAGE itself (granted by supabase_admin) but
-- NOT the grant option, so `grant usage on schema auth to app_user` from
-- postgres silently doesn't take effect (Supabase swallows the error
-- rather than surfacing it — confirmed by testing has_schema_privilege()
-- directly, not assumed). The fix: mark this function SECURITY DEFINER,
-- so it runs with its owner's (postgres's) privileges regardless of who
-- calls it — the same pattern already used below for
-- app.current_org_ids(), and the standard way to delegate access to a
-- restricted schema without granting broad access to the schema itself.
-- ------------------------------------------------------------

create schema if not exists app;

-- Reads the current user id set by the app (Prisma path), falling back
-- to Supabase's native auth.uid() (direct-client path, e.g. Realtime).
-- Returns null if neither is set (e.g. migrations, seed scripts).
create or replace function app.current_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    auth.uid()::text
  )
$$;

-- Returns the set of organization ids the current user has an ACTIVE
-- membership in. SECURITY DEFINER so RLS on `memberships` itself doesn't
-- cause infinite recursion when this function is used inside a policy on
-- `memberships`.
create or replace function app.current_org_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from memberships
  where user_id = app.current_user_id()
    and status = 'ACTIVE'
$$;

revoke execute on function app.current_user_id() from public;
revoke execute on function app.current_org_ids() from public;
grant execute on function app.current_user_id() to app_user, authenticated;
grant execute on function app.current_org_ids() to app_user, authenticated;

-- ------------------------------------------------------------
-- Dedicated non-BYPASSRLS role for the app's Prisma connection.
-- Supabase's default `postgres` role has BYPASSRLS and will silently skip
-- every policy below if used directly — always connect as app_user.
--
-- Run this once per database, then use app_user's credentials (not the
-- default postgres user) in DATABASE_URL / DIRECT_URL.
-- ------------------------------------------------------------
-- create role app_user with login password '<set-a-strong-password>';
-- grant usage on schema public, app to app_user;
-- grant select, insert, update, delete on all tables in schema public to app_user;
-- alter default privileges in schema public grant select, insert, update, delete on tables to app_user;
