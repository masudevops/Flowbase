import type { Prisma } from "@prisma/client";
import { generateNKeysBetween } from "fractional-indexing";
import type { BoardTemplate } from "../templates/types";

/// Applies a template's columns (board-scoped, always freshly created) and
/// card types (org-scoped — upserted by name so applying the same
/// template to a second board in the same org doesn't create duplicates,
/// see schema.prisma's CardType model).
export async function applyTemplate(
  db: Prisma.TransactionClient,
  params: { organizationId: string; boardId: string; template: BoardTemplate },
) {
  const { organizationId, boardId, template } = params;

  const positions = generateNKeysBetween(null, null, template.columns.length);
  await db.column.createMany({
    data: template.columns.map((col, i) => ({
      organizationId,
      boardId,
      name: col.name,
      position: positions[i],
      isDoneColumn: col.isDoneColumn ?? false,
      isBlockedColumn: col.isBlockedColumn ?? false,
    })),
  });

  for (const cardType of template.cardTypes) {
    await db.cardType.upsert({
      where: { organizationId_name: { organizationId, name: cardType.name } },
      update: {},
      create: {
        organizationId,
        name: cardType.name,
        color: cardType.color,
        isDefault: cardType.isDefault ?? false,
      },
    });
  }
}
