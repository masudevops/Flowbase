import { z } from "zod";

export const listWorkflowTemplatesSchema = z.object({
  organizationId: z.string(),
});

export const saveBoardAsTemplateSchema = z.object({
  organizationId: z.string(),
  boardId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(300).optional(),
});

export const deleteWorkflowTemplateSchema = z.object({
  templateId: z.string(),
});
