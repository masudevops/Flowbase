import { router, publicProcedure } from "../trpc";
import { organizationRouter } from "./organization";
import { boardRouter } from "./board";
import { columnRouter } from "./column";
import { cardTypeRouter } from "./cardType";
import { cardRouter } from "./card";
import { commentRouter } from "./comment";
import { checklistRouter } from "./checklist";
import { labelRouter } from "./label";
import { membershipRouter } from "./membership";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date().toISOString(),
  })),
  organization: organizationRouter,
  board: boardRouter,
  column: columnRouter,
  cardType: cardTypeRouter,
  card: cardRouter,
  comment: commentRouter,
  checklist: checklistRouter,
  label: labelRouter,
  membership: membershipRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
