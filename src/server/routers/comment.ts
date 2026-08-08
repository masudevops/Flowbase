import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { listCommentsSchema, createCommentSchema } from "@/schemas/comment.schema";
import { createComment } from "../services/comment.service";
import { notifyNewComment } from "../services/notification.service";

export const commentRouter = router({
  list: protectedProcedure.input(listCommentsSchema).query(({ ctx, input }) =>
    ctx.db.comment.findMany({
      where: { cardId: input.cardId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    }),
  ),

  create: protectedProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const comment = await createComment(ctx.db, {
      organizationId: card.organizationId,
      authorId: ctx.userId,
      cardId: input.cardId,
      body: input.body,
    });

    await notifyNewComment(ctx.db, {
      cardId: input.cardId,
      authorId: ctx.userId,
      body: input.body,
    });

    return comment;
  }),
});
