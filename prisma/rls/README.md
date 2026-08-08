# RLS setup

Prisma has no native RLS support, so policies are applied out-of-band as raw SQL — not as part of `prisma migrate dev`/`deploy`.

## One-time setup per database (local or Supabase)

1. Run migrations as usual: `npx prisma migrate deploy` (or `migrate dev` locally).
2. Create the dedicated `app_user` Postgres role (see the commented block at the bottom of `001_helper_functions.sql`) — uncomment, set a strong password, and run it once via the Supabase SQL editor or `psql`.
3. Run `001_helper_functions.sql`, then `002_policies.sql`, in that order, against the same database.
4. Update `DATABASE_URL` / `DIRECT_URL` in `.env` to connect as `app_user`, not the default `postgres` superuser. The `postgres` role has `BYPASSRLS` and will silently skip every policy here — this is the most common way RLS "looks like it's not working" in local testing.

## Re-running after a schema change

Whenever a new tenant-scoped table is added to `schema.prisma`, add a matching `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` block to `002_policies.sql` and re-run it. This is a manual step — nothing enforces it automatically, so treat it as part of the same PR that adds the table.

## Verifying RLS is actually active

Don't trust `prisma studio` or the seed script's success as a signal — both typically connect as a superuser and bypass RLS. Verify with an integration test that connects as `app_user` and asserts cross-tenant reads return zero rows.
