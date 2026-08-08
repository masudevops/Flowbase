import { z } from "zod";

export const listCardTypesSchema = z.object({
  boardId: z.string(),
});

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .default("#6B7280");

export const createCardTypeSchema = z.object({
  organizationId: z.string(),
  boardId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(40),
  color: hexColor,
});

export const updateCardTypeSchema = z.object({
  cardTypeId: z.string(),
  name: z.string().trim().min(1).max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const deleteCardTypeSchema = z.object({
  cardTypeId: z.string(),
});
