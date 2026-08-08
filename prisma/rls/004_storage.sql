-- ------------------------------------------------------------
-- Attachments: Supabase Storage bucket + RLS
--
-- Private bucket (not public) — access is enforced by RLS on
-- storage.objects, the same tenant-isolation model as every other table
-- in this app, not by unguessable URLs. Files are viewed/downloaded via
-- short-lived signed URLs generated client-side (src/lib/supabase/client.ts),
-- never a permanent public link.
--
-- Path convention: {organizationId}/{cardId}/{cuid}-{fileName}. Policies
-- key off the leading path segment (storage.foldername(name))[1] being
-- an org the caller belongs to — same app.current_org_ids() used
-- everywhere else, which already works for the `authenticated` role (see
-- 001_helper_functions.sql). A malicious client can't fake a different
-- org's id in the path to write into their folder: the INSERT policy's
-- WITH CHECK still evaluates against the caller's own real memberships,
-- not whatever the client claims.
--
-- Idempotent — safe to re-run. See prisma/rls/apply.ts.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "org members can read attachments" on storage.objects;
create policy "org members can read attachments"
on storage.objects for select
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = any (select app.current_org_ids())
);

drop policy if exists "org members can upload attachments" on storage.objects;
create policy "org members can upload attachments"
on storage.objects for insert
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = any (select app.current_org_ids())
);

drop policy if exists "org members can delete attachments" on storage.objects;
create policy "org members can delete attachments"
on storage.objects for delete
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = any (select app.current_org_ids())
);
