import type { Prisma } from "@prisma/client";
import { applyWorkflowTemplate } from "./workflowTemplate.service";
import { writeAuditLog } from "./audit.service";

export async function createBoard(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    name: string;
    description?: string;
    templateId?: string;
  },
) {
  const board = await db.board.create({
    data: {
      organizationId: params.organizationId,
      name: params.name,
      description: params.description,
      sourceTemplateId: params.templateId,
    },
  });

  if (params.templateId) {
    await applyWorkflowTemplate(db, {
      organizationId: params.organizationId,
      boardId: board.id,
      templateId: params.templateId,
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
