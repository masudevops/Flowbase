import { router, publicProcedure } from "../trpc";
import { organizationRouter } from "./organization";
import { boardRouter } from "./board";
import { columnRouter } from "./column";
import { cardTypeRouter } from "./cardType";

// Remaining feature routers (card, comment, checklist, ...) are added
// incrementally in later steps (kanban board -> card detail -> ...).
export const appRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date().toISOString(),
  })),
  organization: organizationRouter,
  board: boardRouter,
  column: columnRouter,
  cardType: cardTypeRouter,
});

export type AppRouter = typeof appRouter;
