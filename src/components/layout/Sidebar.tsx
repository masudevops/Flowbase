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
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-[#D3DBD8] bg-white dark:border-[#23414F] dark:bg-[#0F2A3D]">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href={`/w/${orgSlug}`} className="min-w-0">
          <span className="block font-[family-name:var(--font-plex-mono)] text-xs font-semibold tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
            Kelbara
          </span>
          <span className="block truncate text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
            {organizationName}
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded p-1 text-[#55707D] hover:bg-[#EEF2F0] md:hidden dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E]"
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
        <ThemeToggle className="rounded-md p-1.5 text-[#55707D] hover:bg-[#EEF2F0] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E]" />
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
                  ? "bg-[#1D5C8A]/10 text-[#1D5C8A] dark:bg-[#5FB4E0]/22 dark:text-[#5FB4E0]"
                  : "text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#14242E] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E7EEF0]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#D3DBD8] px-3 py-3 dark:border-[#23414F]">
        <Link
          href={`/settings?from=${orgSlug}`}
          onClick={() => setMobileOpen(false)}
          className="mb-2 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#14242E] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E7EEF0]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D5C8A] text-[11px] font-medium text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]">
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
      <div className="flex items-center justify-between border-b border-[#D3DBD8] bg-white px-4 py-3 md:hidden dark:border-[#23414F] dark:bg-[#0F2A3D]">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded p-1 text-[#55707D] dark:text-[#8FA8B3]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
          {organizationName}
        </span>
        <div className="flex items-center gap-1">
          <NotificationBell organizationId={organizationId} orgSlug={orgSlug} />
          <ThemeToggle className="rounded-md p-1.5 text-[#55707D] dark:text-[#8FA8B3]" />
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
