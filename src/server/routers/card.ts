import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  toggleBlockedSchema,
  setCardLabelsSchema,
  setCardAssigneesSchema,
  cardByIdSchema,
  deleteCardSchema,
  listCardsByBoardSchema,
  listAssignedToMeSchema,
} from "@/schemas/card.schema";
import {
  createCard,
  updateCard,
  moveCard,
  toggleBlocked,
  deleteCard,
  setCardLabels,
  setCardAssignees,
} from "../services/card.service";
import { notifyCardAssigned, notifyAutomationTriggered } from "../services/notification.service";

const cardInclude = {
  cardType: true,
  assignees: { include: { user: true, contact: true } },
  labels: { include: { label: true } },
  checklistItems: { orderBy: { position: "asc" as const } },
  _count: { select: { comments: true } },
  parent: { select: { id: true, title: true } },
  blockedByCard: { select: { id: true, title: true } },
  children: {
    select: { id: true, title: true, isBlocked: true, column: { select: { isDoneColumn: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

export const cardRouter = router({
  listByBoard: protectedProcedure.input(listCardsByBoardSchema).query(({ ctx, input }) =>
    ctx.db.card.findMany({
      where: { boardId: input.boardId, archivedAt: null },
      include: cardInclude,
      orderBy: { position: "asc" },
    }),
  ),

  /// Cross-board: everything assigned to the caller in this workspace,
  /// for the "My Work" view. RLS still scopes this to orgs the caller
  /// actually belongs to regardless of what organizationId is passed —
  /// "I'm one of the assignees" (via CardAssignee) narrows it to "mine"
  /// on top of that; a card with several assignees shows up once for
  /// each of them, not just for a single "primary" one.
  listAssignedToMe: protectedProcedure.input(listAssignedToMeSchema).query(({ ctx, input }) =>
    ctx.db.card.findMany({
      where: {
        organizationId: input.organizationId,
        archivedAt: null,
        assignees: { some: { userId: ctx.userId } },
      },
      include: {
        board: { select: { id: true, name: true } },
        column: { select: { name: true, isDoneColumn: true } },
        cardType: { select: { name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
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
      boardId: card.boardId,
      ...fields,
    });
  }),

  move: protectedProcedure.input(moveCardSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const updated = await moveCard(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId: input.cardId,
      columnId: input.columnId,
      beforePosition: input.beforePosition,
      afterPosition: input.afterPosition,
    });

    if (card.columnId !== input.columnId) {
      const automations = await ctx.db.automation.findMany({
        where: { boardId: card.boardId, triggerColumnId: input.columnId, enabled: true },
      });
      for (const automation of automations) {
        if (automation.action === "NOTIFY_ASSIGNEE") {
          await notifyAutomationTriggered(ctx.db, {
            cardId: input.cardId,
            automationName: automation.name,
            movedById: ctx.userId,
          });
        }
      }
    }

    return updated;
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
      boardId: card.boardId,
      isBlocked: input.isBlocked,
      blockedReason: input.blockedReason,
      blockedByCardId: input.blockedByCardId,
    });
  }),

  setAssignees: protectedProcedure.input(setCardAssigneesSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const { addedUserIds } = await setCardAssignees(ctx.db, {
      organizationId: card.organizationId,
      actorId: ctx.userId,
      cardId: input.cardId,
      assignees: input.assignees,
    });

    for (const userId of addedUserIds) {
      await notifyCardAssigned(ctx.db, { cardId: input.cardId, assigneeId: userId, actorId: ctx.userId });
    }

    return { success: true };
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
