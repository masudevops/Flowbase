import { z } from "zod";

export const listAuditLogByCardSchema = z.object({
  cardId: z.string(),
});
