import { router, protectedProcedure } from "../trpc";
import { dashboardStatsSchema } from "@/schemas/dashboard.schema";

export const dashboardRouter = router({
  stats: protectedProcedure.input(dashboardStatsSchema).query(async ({ ctx, input }) => {
    const boards = await ctx.db.board.findMany({
      where: { organizationId: input.organizationId, archivedAt: null },
      include: {
        cards: {
          where: { archivedAt: null },
          select: { isBlocked: true, dueDate: true, column: { select: { isDoneColumn: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    return boards.map((board) => {
      const openCount = board.cards.filter((c) => !c.column.isDoneColumn).length;
      const blockedCount = board.cards.filter((c) => c.isBlocked).length;
      const overdueCount = board.cards.filter(
        (c) => c.dueDate && c.dueDate < now && !c.column.isDoneColumn,
      ).length;

      return { boardId: board.id, boardName: board.name, openCount, blockedCount, overdueCount };
    });
  }),
});
