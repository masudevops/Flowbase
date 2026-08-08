import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
