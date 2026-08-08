import { z } from "zod";

const priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createCardSchema = z.object({
  boardId: z.string(),
  columnId: z.string(),
  title: z.string().trim().min(1, "Title is required").max(200),
  cardTypeId: z.string().optional(),
  priority: priority.optional(),
});

export const updateCardSchema = z.object({
  cardId: z.string(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(10_000).nullable().optional(),
  priority: priority.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  assigneeContactId: z.string().nullable().optional(),
  cardTypeId: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  parentCardId: z.string().nullable().optional(),
});

export const moveCardSchema = z.object({
  cardId: z.string(),
  columnId: z.string(),
  beforePosition: z.string().nullable(),
  afterPosition: z.string().nullable(),
});

export const toggleBlockedSchema = z.object({
  cardId: z.string(),
  isBlocked: z.boolean(),
  blockedReason: z.string().max(500).nullable().optional(),
});

export const setCardLabelsSchema = z.object({
  cardId: z.string(),
  labelIds: z.array(z.string()),
});

export const cardByIdSchema = z.object({
  cardId: z.string(),
});

export const deleteCardSchema = z.object({
  cardId: z.string(),
});

export const listCardsByBoardSchema = z.object({
  boardId: z.string(),
});

export const listAssignedToMeSchema = z.object({
  organizationId: z.string(),
});
