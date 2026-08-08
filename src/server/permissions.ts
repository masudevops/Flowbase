import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/// Throws FORBIDDEN unless the caller has an ACTIVE ADMIN membership in
/// the org. Use for anything only a project's admin/PM should do:
/// inviting, changing roles, removing members, deleting boards.
export async function assertAdmin(
  db: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
) {
  const membership = await db.membership.findFirst({
    where: { organizationId, userId, status: "ACTIVE" },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only workspace admins can do this." });
  }

  return membership;
}
