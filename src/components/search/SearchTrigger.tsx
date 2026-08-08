"use client";

import { useEffect, useState } from "react";
import { SearchPalette } from "./SearchPalette";

export function SearchTrigger({
  organizationId,
  orgSlug,
}: {
  organizationId: string;
  orgSlug: string;
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
        className="flex items-center gap-2 rounded-md border border-[#DFE1E6] px-2.5 py-1.5 text-sm text-[#5E6C84] hover:border-[#0B5CFF]/50 dark:border-[#2A3547] dark:text-[#8C9BAB] dark:hover:border-[#4C9AFF]/50"
      >
        Search
        <span className="rounded border border-[#DFE1E6] px-1 font-[family-name:var(--font-plex-mono)] text-[10px] dark:border-[#2A3547]">
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
