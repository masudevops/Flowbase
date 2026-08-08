import { z } from "zod";

export const createChecklistItemSchema = z.object({
  cardId: z.string(),
  text: z.string().trim().min(1).max(300),
});

export const toggleChecklistItemSchema = z.object({
  itemId: z.string(),
  isDone: z.boolean(),
});

export const deleteChecklistItemSchema = z.object({
  itemId: z.string(),
});
