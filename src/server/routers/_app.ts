import { router, publicProcedure } from "../trpc";
import { organizationRouter } from "./organization";

// Remaining feature routers (board, card, ...) are added incrementally in
// later steps (workspace/board CRUD -> kanban -> ...).
export const appRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date().toISOString(),
  })),
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
