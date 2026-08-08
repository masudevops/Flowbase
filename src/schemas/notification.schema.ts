import { z } from "zod";

export const listNotificationsSchema = z.object({
  organizationId: z.string(),
});

export const unreadCountSchema = z.object({
  organizationId: z.string(),
});

export const markReadSchema = z.object({
  notificationId: z.string(),
});

export const markAllReadSchema = z.object({
  organizationId: z.string(),
});
