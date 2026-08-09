# Runbook: backup & restore posture

**Last verified:** 2026-08-09, against the live Supabase project this app runs on.

## Current state: no automatic backups exist

Kelbara's Supabase project is on the **Free** plan. Supabase's dashboard-managed
automatic backup feature is a Pro-plan-and-above feature — on Free, there is
**no scheduled backup, no restore button, and no point-in-time recovery**. If
the database were dropped, corrupted, or a bad migration destroyed data right
now, there is currently no way to recover it through Supabase.

This is a real gap, not a theoretical one — worth treating as a decision
point, not something to quietly work around.

## Options (pick one — this is a cost/effort tradeoff, not a code change)

1. **Upgrade to the Supabase Pro plan (~$25/mo)** — turns on daily automatic
   backups with 7-day retention, restorable from the dashboard in a few
   clicks (Settings → Database → Backups). The simplest option and the one
   Supabase itself recommends once a project holds real user data. No
   engineering work required beyond the upgrade itself.
2. **Self-managed backups on the Free plan** — a scheduled job (GitHub
   Actions cron, or similar) running `pg_dump` against `DIRECT_URL` and
   uploading the dump to object storage (e.g. a private Supabase Storage
   bucket or S3). Free in dollars, costs engineering time to set up and
   *must* be paired with periodic restore drills (an untested backup is not
   a backup) — nothing like this exists in this repo yet.
3. **Accept the risk for now** — reasonable while the app has no real
   customer data, unreasonable once it does. Revisit before onboarding
   anyone who isn't a test account.

Whichever is chosen, update this doc's "Current state" section to match —
this file rots the moment the plan changes underneath it.

## If a restore is ever needed (once backups exist)

These steps apply once the project is on a plan with dashboard backups
(option 1 above) — they don't apply today.

1. Supabase dashboard → the Kelbara project → **Database** → **Backups**.
2. Pick the backup point closest to before the incident. Note the
   timestamp — anything written after that point will be lost.
3. Click **Restore**. Supabase restores in place; there is no
   restore-to-a-new-project option on most plans, so this is destructive to
   current state. If possible, snapshot/export current state first even if
   it's suspected-corrupted, in case the "bad" state turns out to still
   contain data worth recovering by hand.
4. After restore completes, verify `npm run db:rls` doesn't need
   re-running — RLS policies live in the schema and should survive a
   Postgres-level restore, but confirm `prisma/rls/apply.ts`'s `app_user`
   role and its password still match `DATABASE_URL`/`DIRECT_URL` in
   whatever environment (local `.env.local`, Vercel) is pointing at the
   restored project; a restore can occasionally reset roles created outside
   Supabase's own migration tracking.
5. Spot-check RLS is still enforced post-restore: run
   `npm test -- tests/tenant-isolation.test.ts` against the restored
   database before considering the incident closed.
