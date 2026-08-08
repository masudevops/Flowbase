import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { withRlsContext } from "./rls";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/// Requires an authenticated user, and runs the resolver inside an
/// RLS-scoped transaction (ctx.db) — see server/rls.ts. Every
/// tenant-scoped router should build on this, not publicProcedure.
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const userId = ctx.userId;

  return withRlsContext(userId, (db) =>
    next({
      ctx: { ...ctx, userId, db },
    }),
  );
});
