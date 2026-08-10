import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { generateNKeysBetween } from "fractional-indexing";
import { BUILT_IN_TEMPLATES } from "../templates";

/// Seeds each org with its own editable copy of the three built-in
/// templates at org-creation time (see organization.service.ts), and
/// once via prisma/backfill-workflow-templates.ts for orgs that already
/// existed when this shipped. Each org's copy is fully independent —
/// editing or deleting one org's "Software" template never touches
/// another org's. Idempotent (skips a key that's already seeded) so the
/// backfill script is safe to re-run.
export async function seedBuiltInTemplates(db: Prisma.TransactionClient, organizationId: string) {
  for (const [key, template] of Object.entries(BUILT_IN_TEMPLATES)) {
    const existing = await db.workflowTemplate.findFirst({ where: { organizationId, key } });
    if (existing) continue;

    await db.workflowTemplate.create({
      data: {
        organizationId,
        key,
        name: template.label,
        description: template.description,
        isBuiltIn: true,
        columns: {
          create: template.columns.map((col, i) => ({
            organizationId,
            name: col.name,
            position: i,
            isDoneColumn: col.isDoneColumn ?? false,
            isBlockedColumn: col.isBlockedColumn ?? false,
          })),
        },
        cardTypes: {
          create: template.cardTypes.map((cardType, i) => ({
            organizationId,
            name: cardType.name,
            color: cardType.color,
            isDefault: cardType.isDefault ?? false,
            position: i,
          })),
        },
      },
    });
  }
}

/// Creates a board's actual Column/CardType rows from a WorkflowTemplate
/// — the live equivalent of what used to read straight from the
/// hardcoded BoardTemplate TS objects. Card types are upserted by
/// (boardId, name) the same as before, purely as insurance against a
/// double-apply; a freshly created board never has any yet.
export async function applyWorkflowTemplate(
  db: Prisma.TransactionClient,
  params: { organizationId: string; boardId: string; templateId: string },
) {
  const template = await db.workflowTemplate.findUnique({
    where: { id: params.templateId },
    include: {
      columns: { orderBy: { position: "asc" } },
      cardTypes: { orderBy: { position: "asc" } },
    },
  });
  if (!template) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
  }

  if (template.columns.length > 0) {
    const positions = generateNKeysBetween(null, null, template.columns.length);
    await db.column.createMany({
      data: template.columns.map((col, i) => ({
        organizationId: params.organizationId,
        boardId: params.boardId,
        name: col.name,
        position: positions[i],
        isDoneColumn: col.isDoneColumn,
        isBlockedColumn: col.isBlockedColumn,
      })),
    });
  }

  for (const cardType of template.cardTypes) {
    await db.cardType.upsert({
      where: { boardId_name: { boardId: params.boardId, name: cardType.name } },
      update: {},
      create: {
        organizationId: params.organizationId,
        boardId: params.boardId,
        name: cardType.name,
        color: cardType.color,
        isDefault: cardType.isDefault,
      },
    });
  }

  return template;
}

/// "Save this board as a template" — captures the board's current
/// columns and card types as a new, independent WorkflowTemplate. Later
/// changes to the board (or the template) never affect each other again;
/// this is a one-time snapshot, not a live link.
export async function saveBoardAsTemplate(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    boardId: string;
    actorId: string;
    name: string;
    description?: string;
  },
) {
  const [columns, cardTypes] = await Promise.all([
    db.column.findMany({ where: { boardId: params.boardId }, orderBy: { position: "asc" } }),
    db.cardType.findMany({ where: { boardId: params.boardId }, orderBy: { createdAt: "asc" } }),
  ]);

  return db.workflowTemplate.create({
    data: {
      organizationId: params.organizationId,
      name: params.name,
      description: params.description,
      isBuiltIn: false,
      createdById: params.actorId,
      columns: {
        create: columns.map((col, i) => ({
          organizationId: params.organizationId,
          name: col.name,
          position: i,
          isDoneColumn: col.isDoneColumn,
          isBlockedColumn: col.isBlockedColumn,
        })),
      },
      cardTypes: {
        create: cardTypes.map((cardType, i) => ({
          organizationId: params.organizationId,
          name: cardType.name,
          color: cardType.color,
          isDefault: cardType.isDefault,
          position: i,
        })),
      },
    },
  });
}

export async function deleteWorkflowTemplate(db: Prisma.TransactionClient, templateId: string) {
  await db.workflowTemplate.delete({ where: { id: templateId } });
}
