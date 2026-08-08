import type { Prisma } from "@prisma/client";

export async function createComment(
  db: Prisma.TransactionClient,
  params: { organizationId: string; authorId: string; cardId: string; body: string },
) {
  return db.comment.create({
    data: {
      organizationId: params.organizationId,
      cardId: params.cardId,
      authorId: params.authorId,
      body: params.body,
    },
  });
}

export async function updateComment(
  db: Prisma.TransactionClient,
  params: { commentId: string; body: string },
) {
  return db.comment.update({
    where: { id: params.commentId },
    data: { body: params.body, editedAt: new Date() },
  });
}

export async function deleteComment(db: Prisma.TransactionClient, params: { commentId: string }) {
  await db.comment.delete({ where: { id: params.commentId } });
}
