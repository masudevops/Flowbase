import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { createOrganizationSchema } from "@/schemas/organization.schema";
import { createOrganization } from "../services/organization.service";

export const organizationRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.userId, status: "ACTIVE" },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => m.organization);
  }),

  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findFirst({
        where: {
          userId: ctx.userId,
          status: "ACTIVE",
          organization: { slug: input.slug },
        },
        include: { organization: true },
      });

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { organization: membership.organization, role: membership.role };
    }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(({ ctx, input }) =>
      createOrganization(ctx.db, { name: input.name, userId: ctx.userId }),
    ),
});
