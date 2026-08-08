-- ------------------------------------------------------------
-- RLS helper functions
--
-- Prisma connects directly to Postgres (not through PostgREST), so
-- Supabase's auth.uid() is NOT automatically populated. The app bridges
-- this by setting a transaction-local session variable before every
-- query (see src/server/rls.ts -> withRlsContext), and these functions
-- read that variable instead of auth.uid().
-- ------------------------------------------------------------

create schema if not exists app;

-- Reads the current user id set by the app for this transaction.
-- Returns null if unset (e.g. unauthenticated context, migrations, seed).
create or replace function app.current_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')
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
grant execute on function app.current_user_id() to app_user;
grant execute on function app.current_org_ids() to app_user;

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
