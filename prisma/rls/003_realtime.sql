-- ------------------------------------------------------------
-- Realtime enablement
--
-- Supabase's `authenticated` role (used by direct browser Supabase
-- client connections, e.g. Realtime subscriptions) needs its own base
-- table-level SELECT grant — RLS restricts WHICH rows are visible, but
-- the role still needs ordinary table-level permission to query at all.
-- Our tables were created via Prisma migrations, not the Supabase
-- dashboard, so none of Supabase's usual automatic grants for
-- authenticated/anon apply here — grant explicitly, one table at a time
-- as the set of realtime-subscribed tables grows.
--
-- Idempotent — safe to re-run. See prisma/rls/apply.ts.
-- ------------------------------------------------------------

-- Supabase grants `authenticated` broad default privileges (INSERT/
-- UPDATE/DELETE, not just SELECT) on new public-schema tables out of the
-- box. RLS still enforces tenant isolation either way, but every actual
-- write in this app goes through app_user via tRPC (audit-logged,
-- fractional-index position math, etc.) — authenticated should only be
-- able to read, for Realtime subscriptions. Revoke first, then grant
-- exactly what's needed, so this is explicit rather than inherited.
revoke all on cards, columns, boards from authenticated;
grant select on cards to authenticated;
grant select on columns to authenticated;
grant select on boards to authenticated;

-- Add these tables to Supabase's built-in realtime publication so
-- subscribed clients actually receive change events for them.
do $$
declare
  t text;
begin
  foreach t in array array['cards', 'columns', 'boards'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
