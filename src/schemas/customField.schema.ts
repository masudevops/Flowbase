import { z } from "zod";

const fieldType = z.enum(["TEXT", "NUMBER", "SELECT"]);

export const listCustomFieldDefinitionsSchema = z.object({
  cardTypeId: z.string(),
});

export const createCustomFieldDefinitionSchema = z
  .object({
    organizationId: z.string(),
    cardTypeId: z.string(),
    name: z.string().trim().min(1, "Name is required").max(60),
    fieldType,
    options: z.array(z.string().trim().min(1)).max(50).optional(),
  })
  .refine((f) => f.fieldType !== "SELECT" || (f.options && f.options.length > 0), {
    message: "A select field needs at least one option.",
    path: ["options"],
  });

export const updateCustomFieldDefinitionSchema = z.object({
  fieldDefinitionId: z.string(),
  name: z.string().trim().min(1).max(60).optional(),
  options: z.array(z.string().trim().min(1)).max(50).optional(),
});

export const deleteCustomFieldDefinitionSchema = z.object({
  fieldDefinitionId: z.string(),
});

export const setCustomFieldValueSchema = z.object({
  cardId: z.string(),
  fieldDefinitionId: z.string(),
  value: z.string().max(2000).nullable(),
});

export const listCustomFieldValuesSchema = z.object({
  cardId: z.string(),
});
