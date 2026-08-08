import { router, protectedProcedure } from "../trpc";
import { listCardTypesSchema } from "@/schemas/cardType.schema";

export const cardTypeRouter = router({
  list: protectedProcedure.input(listCardTypesSchema).query(({ ctx, input }) =>
    ctx.db.cardType.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: "asc" },
    }),
  ),
});
