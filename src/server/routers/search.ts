import { router, protectedProcedure } from "../trpc";
import { searchSchema } from "@/schemas/search.schema";

const CARD_LIMIT = 8;
const BOARD_LIMIT = 5;

export const searchRouter = router({
  query: protectedProcedure.input(searchSchema).query(async ({ ctx, input }) => {
    const { organizationId, query } = input;

    const [cards, boards] = await Promise.all([
      ctx.db.card.findMany({
        where: {
          organizationId,
          archivedAt: null,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          boardId: true,
          board: { select: { name: true } },
          cardType: { select: { name: true, color: true } },
        },
        take: CARD_LIMIT,
        orderBy: { updatedAt: "desc" },
      }),
      ctx.db.board.findMany({
        where: {
          organizationId,
          archivedAt: null,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: BOARD_LIMIT,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return { cards, boards };
  }),
});
