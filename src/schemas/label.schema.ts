import { z } from "zod";

export const listLabelsSchema = z.object({
  organizationId: z.string(),
});

export const createLabelSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#6B7280"),
});
