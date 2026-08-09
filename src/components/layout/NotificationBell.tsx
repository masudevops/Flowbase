"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";

export function NotificationBell({
  organizationId,
  orgSlug,
}: {
  organizationId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(
    { organizationId },
    { refetchInterval: 20_000 },
  );
  const { data: notifications } = trpc.notification.list.useQuery(
    { organizationId },
    { enabled: open },
  );

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate({ organizationId });
      utils.notification.list.invalidate({ organizationId });
    },
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate({ organizationId });
      utils.notification.list.invalidate({ organizationId });
    },
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-[#55707D] hover:bg-[#EEF2F0] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E]"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C1440E] px-1 text-[9px] font-semibold text-white dark:bg-[#E8703A]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border border-[#D3DBD8] bg-white shadow-lg dark:border-[#23414F] dark:bg-[#0F2A3D]">
            <div className="flex items-center justify-between border-b border-[#D3DBD8] px-3 py-2 dark:border-[#23414F]">
              <span className="text-xs font-semibold text-[#14242E] dark:text-[#E7EEF0]">
                Notifications
              </span>
              {!!unreadCount && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate({ organizationId })}
                  className="flex items-center gap-1 text-xs font-medium text-[#1D5C8A] hover:underline dark:text-[#5FB4E0]"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications?.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[#55707D] dark:text-[#8FA8B3]">
                  No notifications yet.
                </p>
              )}
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.readAt) markRead.mutate({ notificationId: n.id });
                    setOpen(false);
                    if (n.card) {
                      router.push(`/w/${orgSlug}/boards/${n.card.boardId}?card=${n.card.id}`);
                    }
                  }}
                  className={cn(
                    "block w-full border-b border-[#D3DBD8] px-3 py-2.5 text-left last:border-0 hover:bg-[#EEF2F0] dark:border-[#23414F] dark:hover:bg-[#0B1F2E]",
                    !n.readAt && "bg-[#1D5C8A]/5 dark:bg-[#5FB4E0]/10",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D5C8A] dark:bg-[#5FB4E0]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#14242E] dark:text-[#E7EEF0]">{n.message}</p>
                      <p className="mt-0.5 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                        {timeAgo(new Date(n.createdAt))}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
