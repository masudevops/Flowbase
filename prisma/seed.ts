import { PrismaClient } from "@prisma/client";
import { generateNKeysBetween } from "fractional-indexing";

/// Explicitly connects via DIRECT_URL (the postgres superuser), not
/// DATABASE_URL (app_user, RLS-enforced) — this is a trusted local admin
/// script with no logged-in user/session context to satisfy RLS's INSERT
/// checks, same reasoning as why migrations also run as the superuser.
/// Never run against production data.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});
async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "demo-co" },
    update: {},
    create: { name: "Demo Co", slug: "demo-co" },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@kelbara.local" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@kelbara.local",
      fullName: "Demo Admin",
    },
  });

  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: { organizationId: org.id, userId: user.id, role: "ADMIN", status: "ACTIVE" },
  });

  const [taskType, bugType, featureType] = await Promise.all([
    prisma.cardType.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Task" } },
      update: {},
      create: { organizationId: org.id, name: "Task", color: "#6B7280", isDefault: true },
    }),
    prisma.cardType.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Bug" } },
      update: {},
      create: { organizationId: org.id, name: "Bug", color: "#EF4444" },
    }),
    prisma.cardType.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Feature" } },
      update: {},
      create: { organizationId: org.id, name: "Feature", color: "#3B82F6" },
    }),
  ]);

  const label = await prisma.label.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "urgent" } },
    update: {},
    create: { organizationId: org.id, name: "urgent", color: "#DC2626" },
  });

  const board = await prisma.board.upsert({
    where: { id: "demo-board-it" },
    update: {},
    create: {
      id: "demo-board-it",
      organizationId: org.id,
      name: "Sprint Board",
      templateKey: "IT_DEV",
    },
  });

  const columnNames = ["Backlog", "To Do", "In Progress", "Blocked", "In Review", "Done"];
  const columnPositions = generateNKeysBetween(null, null, columnNames.length);
  const columns = await Promise.all(
    columnNames.map((name, i) =>
      prisma.column.upsert({
        where: { id: `demo-col-${i}` },
        update: {},
        create: {
          id: `demo-col-${i}`,
          organizationId: org.id,
          boardId: board.id,
          name,
          position: columnPositions[i],
          isDoneColumn: name === "Done",
          isBlockedColumn: name === "Blocked",
        },
      }),
    ),
  );

  const [backlogCol, todoCol, inProgressCol] = columns;
  const cardPositions = generateNKeysBetween(null, null, 3);

  const card1 = await prisma.card.upsert({
    where: { id: "demo-card-1" },
    update: {},
    create: {
      id: "demo-card-1",
      organizationId: org.id,
      boardId: board.id,
      columnId: inProgressCol.id,
      cardTypeId: bugType.id,
      title: "Login page throws 500 on Safari",
      description: "Repro: visit /login in Safari 17, submit valid credentials.",
      priority: "HIGH",
      assigneeId: user.id,
      position: cardPositions[0],
      createdById: user.id,
      labels: { create: [{ labelId: label.id }] },
    },
  });

  await prisma.card.upsert({
    where: { id: "demo-card-2" },
    update: {},
    create: {
      id: "demo-card-2",
      organizationId: org.id,
      boardId: board.id,
      columnId: todoCol.id,
      cardTypeId: featureType.id,
      title: "Add dark mode toggle",
      priority: "LOW",
      position: cardPositions[1],
      createdById: user.id,
    },
  });

  await prisma.card.upsert({
    where: { id: "demo-card-3" },
    update: {},
    create: {
      id: "demo-card-3",
      organizationId: org.id,
      boardId: board.id,
      columnId: backlogCol.id,
      cardTypeId: taskType.id,
      title: "Write onboarding docs",
      priority: "MEDIUM",
      position: cardPositions[2],
      createdById: user.id,
    },
  });

  const checklistPositions = generateNKeysBetween(null, null, 2);
  await prisma.checklistItem.createMany({
    data: [
      {
        organizationId: org.id,
        cardId: card1.id,
        text: "Reproduce locally",
        isDone: true,
        position: checklistPositions[0],
        completedById: user.id,
        completedAt: new Date(),
      },
      {
        organizationId: org.id,
        cardId: card1.id,
        text: "Write regression test",
        isDone: false,
        position: checklistPositions[1],
      },
    ],
    skipDuplicates: true,
  });

  await prisma.comment.create({
    data: {
      organizationId: org.id,
      cardId: card1.id,
      authorId: user.id,
      body: "Looks like a Safari-specific cookie SameSite issue — investigating.",
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      actorId: user.id,
      action: "CARD_CREATED",
      entityType: "card",
      entityId: card1.id,
      cardId: card1.id,
    },
  });

  console.log(`Seeded org "${org.name}" (${org.slug}) with board "${board.name}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
