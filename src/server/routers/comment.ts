import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listCommentsSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} from "@/schemas/comment.schema";
import { createComment, updateComment, deleteComment } from "../services/comment.service";
import { notifyNewComment } from "../services/notification.service";
import { assertAdmin } from "../permissions";

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

  /// Editing is author-only, deliberately narrower than delete — an
  /// admin moderating content is a legitimate org concern (same
  /// reasoning as board deletion/member removal), but rewriting someone
  /// else's words is a different, trust-eroding thing this app doesn't
  /// do even for admins.
  update: protectedProcedure.input(updateCommentSchema).mutation(async ({ ctx, input }) => {
    const comment = await ctx.db.comment.findUnique({ where: { id: input.commentId } });
    if (!comment) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    if (comment.authorId !== ctx.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own comments." });
    }

    return updateComment(ctx.db, { commentId: input.commentId, body: input.body });
  }),

  /// Author can always delete their own comment; an admin can delete
  /// anyone's, for moderation.
  delete: protectedProcedure.input(deleteCommentSchema).mutation(async ({ ctx, input }) => {
    const comment = await ctx.db.comment.findUnique({ where: { id: input.commentId } });
    if (!comment) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    if (comment.authorId !== ctx.userId) {
      await assertAdmin(ctx.db, comment.organizationId, ctx.userId);
    }

    await deleteComment(ctx.db, { commentId: input.commentId });
    return { ok: true };
  }),
});
