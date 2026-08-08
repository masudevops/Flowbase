import { z } from "zod";

export const listContactsSchema = z.object({
  organizationId: z.string(),
});

export const createContactSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email().max(200).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

export const updateContactSchema = z.object({
  contactId: z.string(),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(200).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

export const deleteContactSchema = z.object({
  contactId: z.string(),
});
