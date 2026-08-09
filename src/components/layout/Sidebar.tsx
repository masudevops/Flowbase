"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCheck, Kanban, Users, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar({
  organizationId,
  organizationName,
  orgSlug,
  currentUser,
}: {
  organizationId: string;
  organizationName: string;
  orgSlug: string;
  currentUser: { email: string; fullName: string | null };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: `/w/${orgSlug}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `/w/${orgSlug}/my-work`, label: "My Work", icon: UserCheck, exact: false },
    { href: `/w/${orgSlug}/boards`, label: "Boards", icon: Kanban, exact: false },
    { href: `/w/${orgSlug}/members`, label: "Team", icon: Users, exact: false },
  ];

  const content = (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-[#DFE1E6] bg-white dark:border-[#2A3547] dark:bg-[#161D2E]">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href={`/w/${orgSlug}`} className="min-w-0">
          <span className="block font-[family-name:var(--font-plex-mono)] text-xs font-semibold tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]">
            Kelbara
          </span>
          <span className="block truncate text-sm font-medium text-[#172B4D] dark:text-[#E4E7EC]">
            {organizationName}
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded p-1 text-[#5E6C84] hover:bg-[#F4F6FA] md:hidden dark:text-[#8C9BAB] dark:hover:bg-[#0E1624]"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-3">
        <div className="min-w-0 flex-1">
          <SearchTrigger organizationId={organizationId} orgSlug={orgSlug} fullWidth />
        </div>
        <NotificationBell organizationId={organizationId} orgSlug={orgSlug} />
        <ThemeToggle className="rounded-md p-1.5 text-[#5E6C84] hover:bg-[#F4F6FA] dark:text-[#8C9BAB] dark:hover:bg-[#0E1624]" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#0B5CFF]/10 text-[#0B5CFF] dark:bg-[#4C9AFF]/15 dark:text-[#4C9AFF]"
                  : "text-[#5E6C84] hover:bg-[#F4F6FA] hover:text-[#172B4D] dark:text-[#8C9BAB] dark:hover:bg-[#0E1624] dark:hover:text-[#E4E7EC]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#DFE1E6] px-3 py-3 dark:border-[#2A3547]">
        <Link
          href={`/settings?from=${orgSlug}`}
          onClick={() => setMobileOpen(false)}
          className="mb-2 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#5E6C84] hover:bg-[#F4F6FA] hover:text-[#172B4D] dark:text-[#8C9BAB] dark:hover:bg-[#0E1624] dark:hover:text-[#E4E7EC]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B5CFF] text-[11px] font-medium text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]">
            {(currentUser.fullName ?? currentUser.email).charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {currentUser.fullName ?? currentUser.email}
          </span>
          <Settings className="h-3.5 w-3.5 shrink-0" />
        </Link>
        <div className="px-1">
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[#DFE1E6] bg-white px-4 py-3 md:hidden dark:border-[#2A3547] dark:bg-[#161D2E]">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded p-1 text-[#5E6C84] dark:text-[#8C9BAB]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate text-sm font-medium text-[#172B4D] dark:text-[#E4E7EC]">
          {organizationName}
        </span>
        <div className="flex items-center gap-1">
          <NotificationBell organizationId={organizationId} orgSlug={orgSlug} />
          <ThemeToggle className="rounded-md p-1.5 text-[#5E6C84] dark:text-[#8C9BAB]" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">{content}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative">{content}</div>
        </div>
      )}
    </>
  );
}
