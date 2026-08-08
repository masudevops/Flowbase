import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnSchema,
  deleteColumnSchema,
} from "@/schemas/column.schema";
import {
  createColumn,
  updateColumn,
  reorderColumn,
  deleteColumn,
} from "../services/column.service";

export const columnRouter = router({
  create: protectedProcedure.input(createColumnSchema).mutation(async ({ ctx, input }) => {
    const board = await ctx.db.board.findUnique({ where: { id: input.boardId } });
    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return createColumn(ctx.db, {
      organizationId: board.organizationId,
      actorId: ctx.userId,
      boardId: input.boardId,
      name: input.name,
    });
  }),

  update: protectedProcedure.input(updateColumnSchema).mutation(async ({ ctx, input }) => {
    const column = await ctx.db.column.findUnique({ where: { id: input.columnId } });
    if (!column) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return updateColumn(ctx.db, {
      organizationId: column.organizationId,
      actorId: ctx.userId,
      columnId: input.columnId,
      name: input.name,
      isDoneColumn: input.isDoneColumn,
      isBlockedColumn: input.isBlockedColumn,
    });
  }),

  reorder: protectedProcedure.input(reorderColumnSchema).mutation(async ({ ctx, input }) => {
    const column = await ctx.db.column.findUnique({ where: { id: input.columnId } });
    if (!column) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return reorderColumn(ctx.db, {
      organizationId: column.organizationId,
      actorId: ctx.userId,
      columnId: input.columnId,
      beforePosition: input.beforePosition,
      afterPosition: input.afterPosition,
    });
  }),

  delete: protectedProcedure.input(deleteColumnSchema).mutation(async ({ ctx, input }) => {
    const column = await ctx.db.column.findUnique({
      where: { id: input.columnId },
      include: { _count: { select: { cards: true } } },
    });
    if (!column) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    if (column._count.cards > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Move or delete this column's cards before deleting the column.",
      });
    }

    await deleteColumn(ctx.db, {
      organizationId: column.organizationId,
      actorId: ctx.userId,
      columnId: input.columnId,
    });

    return { success: true };
  }),
});
