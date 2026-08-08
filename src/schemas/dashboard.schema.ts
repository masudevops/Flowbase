import { z } from "zod";

export const dashboardStatsSchema = z.object({
  organizationId: z.string(),
});
