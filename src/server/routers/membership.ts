import { router, protectedProcedure } from "../trpc";
import { listMembersSchema } from "@/schemas/membership.schema";

export const membershipRouter = router({
  list: protectedProcedure.input(listMembersSchema).query(async ({ ctx, input }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { organizationId: input.organizationId, status: "ACTIVE" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      userId: m.userId,
      role: m.role,
      email: m.user.email,
      fullName: m.user.fullName,
    }));
  }),
});
