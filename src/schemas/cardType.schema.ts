import { z } from "zod";

export const listCardTypesSchema = z.object({
  organizationId: z.string(),
});
