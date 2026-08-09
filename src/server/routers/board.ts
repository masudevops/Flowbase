import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  createBoardSchema,
  listBoardsSchema,
  boardByIdSchema,
  archiveBoardSchema,
} from "@/schemas/board.schema";
import { createBoard, archiveBoard } from "../services/board.service";
import { assertAdmin } from "../permissions";

export const boardRouter = router({
  list: protectedProcedure.input(listBoardsSchema).query(({ ctx, input }) =>
    ctx.db.board.findMany({
      where: { organizationId: input.organizationId, archivedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ),

  byId: protectedProcedure.input(boardByIdSchema).query(async ({ ctx, input }) => {
    const board = await ctx.db.board.findUnique({
      where: { id: input.boardId },
      include: { columns: { orderBy: { position: "asc" } } },
    });

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return board;
  }),

  create: protectedProcedure.input(createBoardSchema).mutation(({ ctx, input }) =>
    createBoard(ctx.db, {
      organizationId: input.organizationId,
      actorId: ctx.userId,
      name: input.name,
      description: input.description,
      templateId: input.templateId,
    }),
  ),

  archive: protectedProcedure.input(archiveBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await ctx.db.board.findUnique({ where: { id: input.boardId } });
    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    await assertAdmin(ctx.db, board.organizationId, ctx.userId);

    return archiveBoard(ctx.db, {
      organizationId: board.organizationId,
      actorId: ctx.userId,
      boardId: input.boardId,
    });
  }),
});
