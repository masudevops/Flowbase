import { z } from "zod";

export const listMembersSchema = z.object({
  organizationId: z.string(),
});
