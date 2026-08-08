"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
        className="relative rounded-md p-1.5 text-[#5E6C84] hover:bg-[#F4F6FA] dark:text-[#8C9BAB] dark:hover:bg-[#0E1624]"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DE350B] px-1 text-[9px] font-semibold text-white dark:bg-[#FF5630]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border border-[#DFE1E6] bg-white shadow-lg dark:border-[#2A3547] dark:bg-[#161D2E]">
            <div className="flex items-center justify-between border-b border-[#DFE1E6] px-3 py-2 dark:border-[#2A3547]">
              <span className="text-xs font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
                Notifications
              </span>
              {!!unreadCount && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate({ organizationId })}
                  className="flex items-center gap-1 text-xs font-medium text-[#0B5CFF] hover:underline dark:text-[#4C9AFF]"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications?.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
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
                    "block w-full border-b border-[#DFE1E6] px-3 py-2.5 text-left last:border-0 hover:bg-[#F4F6FA] dark:border-[#2A3547] dark:hover:bg-[#0E1624]",
                    !n.readAt && "bg-[#0B5CFF]/5 dark:bg-[#4C9AFF]/10",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B5CFF] dark:bg-[#4C9AFF]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#172B4D] dark:text-[#E4E7EC]">{n.message}</p>
                      <p className="mt-0.5 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
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
