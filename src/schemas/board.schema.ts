import { z } from "zod";

export const createBoardSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(500).optional(),
  templateKey: z.enum(["IT_DEV", "CONSTRUCTION"]).optional(),
});

export const listBoardsSchema = z.object({
  organizationId: z.string(),
});

export const boardByIdSchema = z.object({
  boardId: z.string(),
});

export const archiveBoardSchema = z.object({
  boardId: z.string(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
