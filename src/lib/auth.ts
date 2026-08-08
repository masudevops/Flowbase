import { prisma } from "@/lib/prisma";

/// Mirrors a Supabase auth.users row into our own `users` table. Called
/// right after sign-in (password login, signup, and the OAuth callback)
/// rather than via a DB trigger — keeps auth.users -> public.users sync
/// entirely in application code, no Supabase-side trigger to maintain.
/// Runs on the default (non-RLS-scoped) Prisma client: `users` has RLS
/// disabled (see prisma/rls/002_policies.sql) since it holds no
/// organizationId and no sensitive fields beyond what auth already gates.
///
/// fullName is optional and only ever written when provided (signup, or
/// Google OAuth's profile name) — plain login calls this on every sign-in
/// without a name, and that must never clobber a name the user already
/// set (via signup or the profile settings page) back to null.
export async function ensureUserRecord(user: { id: string; email: string; fullName?: string | null }) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      ...(user.fullName ? { fullName: user.fullName } : {}),
    },
    create: { id: user.id, email: user.email, fullName: user.fullName ?? null },
  });
}
