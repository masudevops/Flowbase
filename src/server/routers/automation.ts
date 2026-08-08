import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listAutomationsSchema,
  createAutomationSchema,
  updateAutomationSchema,
  deleteAutomationSchema,
} from "@/schemas/automation.schema";
import { assertAdmin } from "../permissions";

export const automationRouter = router({
  list: protectedProcedure.input(listAutomationsSchema).query(({ ctx, input }) =>
    ctx.db.automation.findMany({
      where: { boardId: input.boardId },
      include: { triggerColumn: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ),

  create: protectedProcedure.input(createAutomationSchema).mutation(async ({ ctx, input }) => {
    await assertAdmin(ctx.db, input.organizationId, ctx.userId);

    return ctx.db.automation.create({
      data: {
        organizationId: input.organizationId,
        boardId: input.boardId,
        name: input.name,
        triggerColumnId: input.triggerColumnId,
      },
    });
  }),

  update: protectedProcedure.input(updateAutomationSchema).mutation(async ({ ctx, input }) => {
    const automation = await ctx.db.automation.findUnique({ where: { id: input.automationId } });
    if (!automation) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    await assertAdmin(ctx.db, automation.organizationId, ctx.userId);

    return ctx.db.automation.update({
      where: { id: input.automationId },
      data: { enabled: input.enabled },
    });
  }),

  delete: protectedProcedure.input(deleteAutomationSchema).mutation(async ({ ctx, input }) => {
    const automation = await ctx.db.automation.findUnique({ where: { id: input.automationId } });
    if (!automation) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    await assertAdmin(ctx.db, automation.organizationId, ctx.userId);

    await ctx.db.automation.delete({ where: { id: input.automationId } });
    return { ok: true };
  }),
});
