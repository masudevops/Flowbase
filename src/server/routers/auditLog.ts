import { router, protectedProcedure } from "../trpc";
import { listAuditLogByCardSchema } from "@/schemas/auditLog.schema";

export const auditLogRouter = router({
  listByCard: protectedProcedure.input(listAuditLogByCardSchema).query(({ ctx, input }) =>
    ctx.db.auditLog.findMany({
      where: { cardId: input.cardId },
      include: { actor: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ),
});
