import { z } from "zod";

export const listAutomationsSchema = z.object({
  boardId: z.string(),
});

export const createAutomationSchema = z.object({
  organizationId: z.string(),
  boardId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(100),
  triggerColumnId: z.string(),
});

export const updateAutomationSchema = z.object({
  automationId: z.string(),
  enabled: z.boolean(),
});

export const deleteAutomationSchema = z.object({
  automationId: z.string(),
});
