import { z } from "zod";

export const searchSchema = z.object({
  organizationId: z.string(),
  query: z.string().trim().min(1).max(200),
});
