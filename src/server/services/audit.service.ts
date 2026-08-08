import type { Prisma, AuditAction } from "@prisma/client";

export async function writeAuditLog(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string;
    cardId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await db.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      cardId: params.cardId,
      metadata: params.metadata,
    },
  });
}
