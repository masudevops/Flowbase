import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import {
  listMembersSchema,
  inviteMemberSchema,
  listInvitesSchema,
  cancelInviteSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  acceptInviteSchema,
  acceptInviteByIdSchema,
} from "@/schemas/membership.schema";
import { updateMemberRole, removeMember } from "../services/membership.service";
import {
  createInvite,
  listPendingInvites,
  cancelInvite,
  acceptInvite,
  acceptInviteById,
  getInviteByToken,
  listPendingInvitesForEmail,
} from "../services/invite.service";
import { checkRateLimit, RateLimitExceededError } from "@/lib/ratelimit";

export const membershipRouter = router({
  list: protectedProcedure.input(listMembersSchema).query(async ({ ctx, input }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { organizationId: input.organizationId, status: "ACTIVE" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      email: m.user.email,
      fullName: m.user.fullName,
    }));
  }),

  invite: protectedProcedure.input(inviteMemberSchema).mutation(async ({ ctx, input }) => {
    try {
      await checkRateLimit("invite", ctx.userId);
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: err.message });
      }
      throw err;
    }
    return createInvite(ctx.db, {
      organizationId: input.organizationId,
      actorId: ctx.userId,
      email: input.email,
      role: input.role,
    });
  }),

  listInvites: protectedProcedure.input(listInvitesSchema).query(({ ctx, input }) =>
    listPendingInvites(ctx.db, input.organizationId),
  ),

  cancelInvite: protectedProcedure.input(cancelInviteSchema).mutation(({ ctx, input }) =>
    cancelInvite(ctx.db, {
      organizationId: input.organizationId,
      actorId: ctx.userId,
      inviteId: input.inviteId,
    }),
  ),

  updateRole: protectedProcedure.input(updateMemberRoleSchema).mutation(({ ctx, input }) =>
    updateMemberRole(ctx.db, {
      organizationId: input.organizationId,
      actorId: ctx.userId,
      membershipId: input.membershipId,
      role: input.role,
    }),
  ),

  remove: protectedProcedure.input(removeMemberSchema).mutation(({ ctx, input }) =>
    removeMember(ctx.db, {
      organizationId: input.organizationId,
      actorId: ctx.userId,
      membershipId: input.membershipId,
    }),
  ),

  /// Unauthenticated-safe preview so /invite/[token] can show "you're
  /// joining Acme Corp" before asking someone to log in or sign up.
  previewInvite: publicProcedure.input(acceptInviteSchema).query(async ({ input }) => {
    const invite = await getInviteByToken(input.token);
    if (!invite) return null;
    return { organizationName: invite.organization.name, role: invite.role, email: invite.email };
  }),

  acceptInvite: protectedProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const supabaseUser = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.userId } });
      return acceptInvite(ctx.db, {
        token: input.token,
        userId: ctx.userId,
        userEmail: supabaseUser.email,
      });
    }),

  /// Powers /onboarding's "Join {org}" fallback for a signed-in user
  /// whose invite token didn't survive the signup/login redirect chain.
  listMyInvites: protectedProcedure.query(async ({ ctx }) => {
    const supabaseUser = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    return listPendingInvitesForEmail(supabaseUser.email);
  }),

  acceptInviteById: protectedProcedure
    .input(acceptInviteByIdSchema)
    .mutation(async ({ ctx, input }) => {
      const supabaseUser = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.userId } });
      return acceptInviteById(ctx.db, {
        inviteId: input.inviteId,
        userId: ctx.userId,
        userEmail: supabaseUser.email,
      });
    }),
});
