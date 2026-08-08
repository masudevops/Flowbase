import type { Prisma, MembershipRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { assertAdmin } from "../permissions";
import { writeAuditLog } from "./audit.service";

async function assertNotLastAdmin(
  db: Prisma.TransactionClient,
  organizationId: string,
  membershipId: string,
) {
  const target = await db.membership.findUnique({ where: { id: membershipId } });
  if (!target || target.organizationId !== organizationId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  if (target.role !== "ADMIN") return target;

  const otherAdmins = await db.membership.count({
    where: { organizationId, role: "ADMIN", status: "ACTIVE", id: { not: membershipId } },
  });
  if (otherAdmins === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A workspace needs at least one admin — promote someone else first.",
    });
  }

  return target;
}

export async function updateMemberRole(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; membershipId: string; role: MembershipRole },
) {
  await assertAdmin(db, params.organizationId, params.actorId);

  if (params.role !== "ADMIN") {
    await assertNotLastAdmin(db, params.organizationId, params.membershipId);
  }

  const membership = await db.membership.update({
    where: { id: params.membershipId },
    data: { role: params.role },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "MEMBER_ROLE_CHANGED",
    entityType: "membership",
    entityId: membership.id,
    metadata: { role: params.role },
  });

  return membership;
}

export async function removeMember(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; membershipId: string },
) {
  const target = await db.membership.findUnique({ where: { id: params.membershipId } });
  if (!target || target.organizationId !== params.organizationId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const isSelf = target.userId === params.actorId;
  if (!isSelf) {
    await assertAdmin(db, params.organizationId, params.actorId);
  }
  await assertNotLastAdmin(db, params.organizationId, params.membershipId);

  await db.membership.delete({ where: { id: params.membershipId } });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "MEMBER_REMOVED",
    entityType: "membership",
    entityId: target.id,
  });

  return { ok: true };
}
