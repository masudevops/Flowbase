import type { Prisma } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import { writeAuditLog } from "./audit.service";

export async function createCard(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    boardId: string;
    columnId: string;
    title: string;
    cardTypeId?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  },
) {
  const [column, last] = await Promise.all([
    db.column.findUniqueOrThrow({ where: { id: params.columnId } }),
    db.card.findFirst({ where: { columnId: params.columnId }, orderBy: { position: "desc" } }),
  ]);

  const card = await db.card.create({
    data: {
      organizationId: params.organizationId,
      boardId: params.boardId,
      columnId: params.columnId,
      cardTypeId: params.cardTypeId,
      title: params.title,
      priority: params.priority,
      position: generateKeyBetween(last?.position ?? null, null),
      isBlocked: column.isBlockedColumn,
      createdById: params.actorId,
    },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "CARD_CREATED",
    entityType: "card",
    entityId: card.id,
    cardId: card.id,
  });

  return card;
}

export async function updateCard(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    cardId: string;
    title?: string;
    description?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string | null;
    assigneeId?: string | null;
    cardTypeId?: string | null;
    location?: string | null;
  },
) {
  const { cardId, organizationId, actorId, ...fields } = params;

  const card = await db.card.update({
    where: { id: cardId },
    data: {
      title: fields.title,
      description: fields.description,
      priority: fields.priority,
      dueDate: fields.dueDate === undefined ? undefined : fields.dueDate ? new Date(fields.dueDate) : null,
      assigneeId: fields.assigneeId,
      cardTypeId: fields.cardTypeId,
      location: fields.location,
    },
  });

  await writeAuditLog(db, {
    organizationId,
    actorId,
    action: "CARD_UPDATED",
    entityType: "card",
    entityId: card.id,
    cardId: card.id,
    metadata: fields,
  });

  return card;
}

export async function moveCard(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    cardId: string;
    columnId: string;
    beforePosition: string | null;
    afterPosition: string | null;
  },
) {
  const [card, targetColumn] = await Promise.all([
    db.card.findUniqueOrThrow({ where: { id: params.cardId } }),
    db.column.findUniqueOrThrow({ where: { id: params.columnId } }),
  ]);

  const changingColumn = card.columnId !== params.columnId;
  let isBlocked = card.isBlocked;
  if (changingColumn) {
    if (targetColumn.isBlockedColumn) {
      isBlocked = true;
    } else if (card.isBlocked) {
      // Only auto-clear if it was blocked because of the column it's
      // leaving — a manual block set via toggleBlocked while sitting in a
      // non-blocked column is unaffected by moves through other columns.
      const previousColumn = await db.column.findUnique({ where: { id: card.columnId } });
      if (previousColumn?.isBlockedColumn) {
        isBlocked = false;
      }
    }
  }

  const updated = await db.card.update({
    where: { id: params.cardId },
    data: {
      columnId: params.columnId,
      position: generateKeyBetween(params.beforePosition, params.afterPosition),
      isBlocked,
      blockedReason: isBlocked ? card.blockedReason : null,
    },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "CARD_MOVED",
    entityType: "card",
    entityId: updated.id,
    cardId: updated.id,
    metadata: { fromColumnId: card.columnId, toColumnId: params.columnId },
  });

  return updated;
}

export async function toggleBlocked(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    cardId: string;
    isBlocked: boolean;
    blockedReason?: string | null;
  },
) {
  const card = await db.card.update({
    where: { id: params.cardId },
    data: {
      isBlocked: params.isBlocked,
      blockedReason: params.isBlocked ? (params.blockedReason ?? null) : null,
    },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: params.isBlocked ? "CARD_BLOCKED" : "CARD_UNBLOCKED",
    entityType: "card",
    entityId: card.id,
    cardId: card.id,
  });

  return card;
}

export async function deleteCard(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; cardId: string },
) {
  await db.card.delete({ where: { id: params.cardId } });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "CARD_DELETED",
    entityType: "card",
    entityId: params.cardId,
  });
}

export async function setCardLabels(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; cardId: string; labelIds: string[] },
) {
  await db.cardLabel.deleteMany({ where: { cardId: params.cardId } });
  if (params.labelIds.length > 0) {
    await db.cardLabel.createMany({
      data: params.labelIds.map((labelId) => ({ cardId: params.cardId, labelId })),
    });
  }

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "CARD_UPDATED",
    entityType: "card",
    entityId: params.cardId,
    cardId: params.cardId,
    metadata: { labelIds: params.labelIds },
  });
}
