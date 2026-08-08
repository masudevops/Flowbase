import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  createChecklistItemSchema,
  toggleChecklistItemSchema,
  deleteChecklistItemSchema,
} from "@/schemas/checklist.schema";
import {
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "../services/checklist.service";

export const checklistRouter = router({
  create: protectedProcedure.input(createChecklistItemSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return createChecklistItem(ctx.db, {
      organizationId: card.organizationId,
      cardId: input.cardId,
      text: input.text,
    });
  }),

  toggle: protectedProcedure.input(toggleChecklistItemSchema).mutation(({ ctx, input }) =>
    toggleChecklistItem(ctx.db, {
      itemId: input.itemId,
      isDone: input.isDone,
      completedById: ctx.userId,
    }),
  ),

  delete: protectedProcedure.input(deleteChecklistItemSchema).mutation(async ({ ctx, input }) => {
    await deleteChecklistItem(ctx.db, input.itemId);
    return { success: true };
  }),
});
