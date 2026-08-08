import { router, protectedProcedure } from "../trpc";
import {
  listNotificationsSchema,
  unreadCountSchema,
  markReadSchema,
  markAllReadSchema,
} from "@/schemas/notification.schema";

export const notificationRouter = router({
  list: protectedProcedure.input(listNotificationsSchema).query(({ ctx, input }) =>
    ctx.db.notification.findMany({
      where: { organizationId: input.organizationId, userId: ctx.userId },
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
        card: { select: { id: true, title: true, boardId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ),

  unreadCount: protectedProcedure.input(unreadCountSchema).query(({ ctx, input }) =>
    ctx.db.notification.count({
      where: { organizationId: input.organizationId, userId: ctx.userId, readAt: null },
    }),
  ),

  markRead: protectedProcedure.input(markReadSchema).mutation(({ ctx, input }) =>
    ctx.db.notification.update({
      where: { id: input.notificationId },
      data: { readAt: new Date() },
    }),
  ),

  markAllRead: protectedProcedure.input(markAllReadSchema).mutation(({ ctx, input }) =>
    ctx.db.notification.updateMany({
      where: { organizationId: input.organizationId, userId: ctx.userId, readAt: null },
      data: { readAt: new Date() },
    }),
  ),
});
