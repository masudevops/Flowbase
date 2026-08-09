import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listWorkflowTemplatesSchema,
  saveBoardAsTemplateSchema,
  deleteWorkflowTemplateSchema,
} from "@/schemas/workflowTemplate.schema";
import { saveBoardAsTemplate, deleteWorkflowTemplate } from "../services/workflowTemplate.service";

export const workflowTemplateRouter = router({
  list: protectedProcedure.input(listWorkflowTemplatesSchema).query(({ ctx, input }) =>
    ctx.db.workflowTemplate.findMany({
      where: { organizationId: input.organizationId },
      include: {
        columns: { orderBy: { position: "asc" } },
        cardTypes: { orderBy: { position: "asc" } },
      },
      orderBy: [{ isBuiltIn: "desc" }, { createdAt: "asc" }],
    }),
  ),

  saveFromBoard: protectedProcedure.input(saveBoardAsTemplateSchema).mutation(async ({ ctx, input }) => {
    const board = await ctx.db.board.findUnique({ where: { id: input.boardId } });
    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return saveBoardAsTemplate(ctx.db, {
      organizationId: input.organizationId,
      boardId: input.boardId,
      actorId: ctx.userId,
      name: input.name,
      description: input.description,
    });
  }),

  delete: protectedProcedure.input(deleteWorkflowTemplateSchema).mutation(async ({ ctx, input }) => {
    const template = await ctx.db.workflowTemplate.findUnique({ where: { id: input.templateId } });
    if (!template) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    await deleteWorkflowTemplate(ctx.db, input.templateId);
    return { ok: true };
  }),
});
