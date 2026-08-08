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
  /// Card types are org-scoped, not board-scoped (see schema.prisma) —
  /// applying a template upserts these by name rather than creating
  /// duplicates if another board in the same org already applied them.
  cardTypes: BoardTemplateCardType[];
};
