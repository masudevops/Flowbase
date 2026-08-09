"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPalette } from "./SearchPalette";

export function SearchTrigger({
  organizationId,
  orgSlug,
  fullWidth = false,
}: {
  organizationId: string;
  orgSlug: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-[#D3DBD8] px-2.5 py-1.5 text-sm text-[#55707D] hover:border-[#1D5C8A]/50 dark:border-[#23414F] dark:text-[#8FA8B3] dark:hover:border-[#5FB4E0]/50",
          fullWidth && "w-full",
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search</span>
        <span className="rounded border border-[#D3DBD8] px-1 font-[family-name:var(--font-plex-mono)] text-[10px] dark:border-[#23414F]">
          ⌘K
        </span>
      </button>

      {open && (
        <SearchPalette
          organizationId={organizationId}
          orgSlug={orgSlug}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
