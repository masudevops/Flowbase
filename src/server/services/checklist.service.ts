import type { Prisma } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";

export async function createChecklistItem(
  db: Prisma.TransactionClient,
  params: { organizationId: string; cardId: string; text: string },
) {
  const last = await db.checklistItem.findFirst({
    where: { cardId: params.cardId },
    orderBy: { position: "desc" },
  });

  return db.checklistItem.create({
    data: {
      organizationId: params.organizationId,
      cardId: params.cardId,
      text: params.text,
      position: generateKeyBetween(last?.position ?? null, null),
    },
  });
}

export async function toggleChecklistItem(
  db: Prisma.TransactionClient,
  params: { itemId: string; isDone: boolean; completedById: string | null },
) {
  return db.checklistItem.update({
    where: { id: params.itemId },
    data: {
      isDone: params.isDone,
      completedById: params.isDone ? params.completedById : null,
      completedAt: params.isDone ? new Date() : null,
    },
  });
}

export async function deleteChecklistItem(db: Prisma.TransactionClient, itemId: string) {
  await db.checklistItem.delete({ where: { id: itemId } });
}
