import { router, protectedProcedure } from "../trpc";
import { listLabelsSchema, createLabelSchema } from "@/schemas/label.schema";

export const labelRouter = router({
  list: protectedProcedure.input(listLabelsSchema).query(({ ctx, input }) =>
    ctx.db.label.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { name: "asc" },
    }),
  ),

  create: protectedProcedure.input(createLabelSchema).mutation(({ ctx, input }) =>
    ctx.db.label.create({
      data: { organizationId: input.organizationId, name: input.name, color: input.color },
    }),
  ),
});
