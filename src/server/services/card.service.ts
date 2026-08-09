import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
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
    boardId: string;
    title?: string;
    description?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate?: string | null;
    dueDate?: string | null;
    cardTypeId?: string | null;
    location?: string | null;
    parentCardId?: string | null;
  },
) {
  const { cardId, organizationId, actorId, boardId, ...fields } = params;

  if (fields.parentCardId) {
    if (fields.parentCardId === cardId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A card can't be its own parent." });
    }
    const parent = await db.card.findUnique({ where: { id: fields.parentCardId } });
    if (!parent || parent.boardId !== boardId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Parent must be a card on the same board." });
    }
    if (parent.parentCardId === cardId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "That would create a loop." });
    }
  }

  const card = await db.card.update({
    where: { id: cardId },
    data: {
      title: fields.title,
      description: fields.description,
      priority: fields.priority,
      startDate:
        fields.startDate === undefined ? undefined : fields.startDate ? new Date(fields.startDate) : null,
      dueDate: fields.dueDate === undefined ? undefined : fields.dueDate ? new Date(fields.dueDate) : null,
      cardTypeId: fields.cardTypeId,
      location: fields.location,
      parentCardId: fields.parentCardId,
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
    boardId: string;
    isBlocked: boolean;
    blockedReason?: string | null;
    blockedByCardId?: string | null;
  },
) {
  if (params.isBlocked && params.blockedByCardId) {
    if (params.blockedByCardId === params.cardId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A card can't block itself." });
    }
    const blocker = await db.card.findUnique({ where: { id: params.blockedByCardId } });
    if (!blocker || blocker.boardId !== params.boardId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Blocked-by must be a card on the same board." });
    }
  }

  const card = await db.card.update({
    where: { id: params.cardId },
    data: {
      isBlocked: params.isBlocked,
      blockedReason: params.isBlocked ? (params.blockedReason ?? null) : null,
      blockedByCardId: params.isBlocked ? (params.blockedByCardId ?? null) : null,
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
  // Row lock so two overlapping setLabels calls for the same card (rapid
  // toggle clicks each firing their own request) serialize instead of
  // racing — without this, a "delete all, recreate desired set" pattern
  // lets whichever transaction happens to commit last win, regardless of
  // which one the client issued last (Epic 8.1).
  await db.$queryRaw`select id from cards where id = ${params.cardId} for update`;

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

/// Replaces a card's full assignee set (registered members and/or
/// external contacts — same never-both-on-one-row rule the legacy
/// single-assignee columns used to enforce, just per row now instead of
/// per card). Diffs against the current rows rather than
/// delete-then-recreate-everything so callers can tell which
/// assignments are genuinely new (returned as `addedUserIds`) — the
/// router uses that to send assignment notifications once per newly-
/// added person, not once per save regardless of what actually changed.
export async function setCardAssignees(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    cardId: string;
    assignees: { userId?: string; contactId?: string }[];
  },
) {
  // Same row-lock reasoning as setCardLabels above — this reads
  // "current" assignees then writes a diff against it, which two
  // overlapping requests for the same card could otherwise race (Epic
  // 8.1's finding turned out to affect assignees too, not just labels).
  await db.$queryRaw`select id from cards where id = ${params.cardId} for update`;

  const current = await db.cardAssignee.findMany({ where: { cardId: params.cardId } });

  const desiredUserIds = new Set(params.assignees.map((a) => a.userId).filter((v): v is string => !!v));
  const desiredContactIds = new Set(params.assignees.map((a) => a.contactId).filter((v): v is string => !!v));
  const existingUserIds = new Set(current.filter((r) => r.userId).map((r) => r.userId!));
  const existingContactIds = new Set(current.filter((r) => r.contactId).map((r) => r.contactId!));

  const toRemove = current.filter(
    (row) =>
      (row.userId && !desiredUserIds.has(row.userId)) || (row.contactId && !desiredContactIds.has(row.contactId)),
  );
  const addedUserIds = [...desiredUserIds].filter((id) => !existingUserIds.has(id));
  const addedContactIds = [...desiredContactIds].filter((id) => !existingContactIds.has(id));

  if (toRemove.length > 0) {
    await db.cardAssignee.deleteMany({ where: { id: { in: toRemove.map((row) => row.id) } } });
  }
  if (addedUserIds.length > 0 || addedContactIds.length > 0) {
    await db.cardAssignee.createMany({
      data: [
        ...addedUserIds.map((userId) => ({ organizationId: params.organizationId, cardId: params.cardId, userId })),
        ...addedContactIds.map((contactId) => ({
          organizationId: params.organizationId,
          cardId: params.cardId,
          contactId,
        })),
      ],
    });
  }

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "CARD_UPDATED",
    entityType: "card",
    entityId: params.cardId,
    cardId: params.cardId,
    metadata: { assigneeUserIds: [...desiredUserIds], assigneeContactIds: [...desiredContactIds] },
  });

  return { addedUserIds };
}
