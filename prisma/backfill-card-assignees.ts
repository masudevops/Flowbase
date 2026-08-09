/// One-time (idempotent) data migration: creates a CardAssignee row for
/// every existing card that has a legacy assigneeId or
/// assigneeContactId set, so multi-assignee support (CardAssignee)
/// starts with every card's existing single assignee already carried
/// over — no data loss. Connects via DIRECT_URL (superuser, bypasses
/// RLS), same reasoning as every other backfill script in this repo.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

async function main() {
  const cards = await prisma.card.findMany({
    where: { OR: [{ assigneeId: { not: null } }, { assigneeContactId: { not: null } }] },
    select: { id: true, organizationId: true, assigneeId: true, assigneeContactId: true },
  });

  let created = 0;
  let skipped = 0;

  for (const card of cards) {
    if (card.assigneeId) {
      const existing = await prisma.cardAssignee.findUnique({
        where: { cardId_userId: { cardId: card.id, userId: card.assigneeId } },
      });
      if (existing) {
        skipped++;
      } else {
        await prisma.cardAssignee.create({
          data: { organizationId: card.organizationId, cardId: card.id, userId: card.assigneeId },
        });
        created++;
      }
    }
    if (card.assigneeContactId) {
      const existing = await prisma.cardAssignee.findUnique({
        where: { cardId_contactId: { cardId: card.id, contactId: card.assigneeContactId } },
      });
      if (existing) {
        skipped++;
      } else {
        await prisma.cardAssignee.create({
          data: { organizationId: card.organizationId, cardId: card.id, contactId: card.assigneeContactId },
        });
        created++;
      }
    }
  }

  console.log(
    `Done — ${cards.length} cards with a legacy assignee, ${created} CardAssignee rows created, ${skipped} already existed.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
