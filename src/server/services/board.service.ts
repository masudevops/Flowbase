import type { Prisma } from "@prisma/client";
import { BOARD_TEMPLATES, type TemplateKey } from "../templates";
import { applyTemplate } from "./template.service";
import { writeAuditLog } from "./audit.service";

export async function createBoard(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    name: string;
    description?: string;
    templateKey?: TemplateKey;
  },
) {
  const board = await db.board.create({
    data: {
      organizationId: params.organizationId,
      name: params.name,
      description: params.description,
      templateKey: params.templateKey,
    },
  });

  if (params.templateKey) {
    await applyTemplate(db, {
      organizationId: params.organizationId,
      boardId: board.id,
      template: BOARD_TEMPLATES[params.templateKey],
    });
  }

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "BOARD_CREATED",
    entityType: "board",
    entityId: board.id,
  });

  return board;
}

export async function archiveBoard(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; boardId: string },
) {
  const board = await db.board.update({
    where: { id: params.boardId },
    data: { archivedAt: new Date() },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "BOARD_DELETED",
    entityType: "board",
    entityId: board.id,
  });

  return board;
}
