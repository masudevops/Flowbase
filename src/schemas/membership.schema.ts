import { z } from "zod";

export const listMembersSchema = z.object({
  organizationId: z.string(),
});

const roleSchema = z.enum(["ADMIN", "MEMBER"]);

export const inviteMemberSchema = z.object({
  organizationId: z.string(),
  email: z.string().trim().email(),
  role: roleSchema.default("MEMBER"),
});

export const listInvitesSchema = z.object({
  organizationId: z.string(),
});

export const cancelInviteSchema = z.object({
  organizationId: z.string(),
  inviteId: z.string(),
});

export const updateMemberRoleSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
  role: roleSchema,
});

export const removeMemberSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
});

export const acceptInviteSchema = z.object({
  token: z.string(),
});

export const acceptInviteByIdSchema = z.object({
  inviteId: z.string(),
});
