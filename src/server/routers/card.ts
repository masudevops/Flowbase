import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  toggleBlockedSchema,
  setCardLabelsSchema,
  cardByIdSchema,
  deleteCardSchema,
  listCardsByBoardSchema,
} from "@/schemas/card.schema";
import {
  createCard,
  updateCard,
  moveCard,
  toggleBlocked,
  deleteCard,
  setCardLabels,
} from "../services/card.service";

const cardInclude = {
  cardType: true,
  assignee: true,
  labels: { include: { label: true } },
  checklistItems: { orderBy: { position: "asc" as const } },
  _count: { select: { comments: true } },
};

export const cardRouter = router({
  listByBoard: protectedProcedure.input(listCardsByBoardSchema).query(({ ctx, input }) =>
    ctx.db.card.findMany({
      where: { boardId: input.boardId, archivedAt: null },
      include: cardInclude,
      orderBy: { position: "asc" },
    }),
  ),

  byId: protectedProcedure.input(cardByIdSchema).query(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({
      where: { id: input.cardId },
      include: cardInclude,
    });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return card;
  }),

  create: protectedProcedure.input(createCardSchema).mutation(async ({ ctx, input }) => {
    const board = await ctx.db.board.findUnique({ where: { id: input.boardId } });
    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return createCard(ctx.db, {
      organizationId: board.organizationId,
      actorId: ctx.userId,
      boardId: input.boardId,
      columnId: input.columnId,
      title: input.title,
      cardTypeId: input.cardTypeId,
      priority: input.priority,
    });
  }),

  update: protectedProcedure.input(updateCardSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const { cardId, ...fields } = input;
    return updateCard(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId,
      ...fields,
    });
  }),

  move: protectedProcedure.input(moveCardSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return moveCard(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId: input.cardId,
      columnId: input.columnId,
      beforePosition: input.beforePosition,
      afterPosition: input.afterPosition,
    });
  }),

  toggleBlocked: protectedProcedure.input(toggleBlockedSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return toggleBlocked(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId: input.cardId,
      isBlocked: input.isBlocked,
      blockedReason: input.blockedReason,
    });
  }),

  setLabels: protectedProcedure.input(setCardLabelsSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    await setCardLabels(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId: input.cardId,
      labelIds: input.labelIds,
    });

    return { success: true };
  }),

  delete: protectedProcedure.input(deleteCardSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    await deleteCard(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId: input.cardId,
    });

    return { success: true };
  }),
});
