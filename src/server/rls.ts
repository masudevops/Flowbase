import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TransactionClient = Prisma.TransactionClient;

/// Bridges Supabase JWT auth to Postgres RLS for a Prisma connection.
/// Wraps `fn` in a transaction and sets a transaction-local session
/// variable (`request.jwt.claim.sub`) that prisma/rls/001_helper_functions.sql
/// reads via app.current_user_id(). Transaction-local (not session-local)
/// so it can't leak across connections reused by the pooler.
///
/// Timeout raised from Prisma's 5s default: some resolvers (card
/// assignment, comments, automations) call notification.service.ts
/// inside this same transaction, which makes a real HTTP call to Resend
/// before writing the in-app notification row. Caught live in testing —
/// a slow/failing Resend response pushed a mutation past 5s and the
/// whole transaction (including unrelated DB writes) got killed by
/// Prisma's "Transaction already closed" error. 20s comfortably covers
/// realistic email-API latency without masking a truly hung request.
export async function withRlsContext<T>(
  userId: string,
  fn: (db: TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`select set_config('request.jwt.claim.sub', ${userId}, true)`;
      return fn(tx);
    },
    { timeout: 20_000 },
  );
}
