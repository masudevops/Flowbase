import { prisma } from "@/lib/prisma";

/// Mirrors a Supabase auth.users row into our own `users` table. Called
/// right after sign-in (password login, signup, and the OAuth callback)
/// rather than via a DB trigger — keeps auth.users -> public.users sync
/// entirely in application code, no Supabase-side trigger to maintain.
/// Runs on the default (non-RLS-scoped) Prisma client: `users` has RLS
/// disabled (see prisma/rls/002_policies.sql) since it holds no
/// organizationId and no sensitive fields beyond what auth already gates.
export async function ensureUserRecord(user: { id: string; email: string }) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: { id: user.id, email: user.email },
  });
}
