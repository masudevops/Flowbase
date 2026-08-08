import type { Prisma } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import { writeAuditLog } from "./audit.service";

export async function createColumn(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; boardId: string; name: string },
) {
  const last = await db.column.findFirst({
    where: { boardId: params.boardId },
    orderBy: { position: "desc" },
  });

  const column = await db.column.create({
    data: {
      organizationId: params.organizationId,
      boardId: params.boardId,
      name: params.name,
      position: generateKeyBetween(last?.position ?? null, null),
    },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "COLUMN_CREATED",
    entityType: "column",
    entityId: column.id,
  });

  return column;
}

export async function updateColumn(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    columnId: string;
    name?: string;
    isDoneColumn?: boolean;
    isBlockedColumn?: boolean;
  },
) {
  const column = await db.column.update({
    where: { id: params.columnId },
    data: {
      name: params.name,
      isDoneColumn: params.isDoneColumn,
      isBlockedColumn: params.isBlockedColumn,
    },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "COLUMN_UPDATED",
    entityType: "column",
    entityId: column.id,
  });

  return column;
}

export async function reorderColumn(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    columnId: string;
    beforePosition: string | null;
    afterPosition: string | null;
  },
) {
  const column = await db.column.update({
    where: { id: params.columnId },
    data: { position: generateKeyBetween(params.beforePosition, params.afterPosition) },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "COLUMN_REORDERED",
    entityType: "column",
    entityId: column.id,
  });

  return column;
}

export async function deleteColumn(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; columnId: string },
) {
  await db.column.delete({ where: { id: params.columnId } });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "COLUMN_DELETED",
    entityType: "column",
    entityId: params.columnId,
  });
}
