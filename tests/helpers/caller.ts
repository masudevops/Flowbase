import { appRouter } from "@/server/routers/_app";

/// Builds a real tRPC caller for a given user id (or null, for an
/// unauthenticated request) — no HTTP, no Supabase Auth involved, but it
/// goes through the exact same protectedProcedure -> withRlsContext ->
/// Postgres RLS chain a real request would. This is the right boundary
/// for testing authorization: high fidelity (real RLS, real SQL), fast
/// (no server, no browser).
export function callerAs(userId: string | null) {
  return appRouter.createCaller({ userId });
}
