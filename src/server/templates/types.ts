export type BoardTemplateColumn = {
  name: string;
  isDoneColumn?: boolean;
  isBlockedColumn?: boolean;
};

export type BoardTemplateCardType = {
  name: string;
  color: string;
  isDefault?: boolean;
};

export type BoardTemplate = {
  key: string;
  label: string;
  description: string;
  columns: BoardTemplateColumn[];
  /// Card types are board-scoped (see schema.prisma) — applying this
  /// template creates its own set, isolated from every other board's.
  cardTypes: BoardTemplateCardType[];
};
