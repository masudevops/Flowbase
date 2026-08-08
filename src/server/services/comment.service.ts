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
