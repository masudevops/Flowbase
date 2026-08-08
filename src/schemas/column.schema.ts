import { z } from "zod";

export const createColumnSchema = z.object({
  boardId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(60),
});

export const updateColumnSchema = z.object({
  columnId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(60).optional(),
  isDoneColumn: z.boolean().optional(),
  isBlockedColumn: z.boolean().optional(),
});

export const reorderColumnSchema = z.object({
  columnId: z.string(),
  /// Fractional-index positions of the columns immediately before/after
  /// the target slot, computed client-side; either may be null (moving
  /// to the very start/end).
  beforePosition: z.string().nullable(),
  afterPosition: z.string().nullable(),
});

export const deleteColumnSchema = z.object({
  columnId: z.string(),
});
