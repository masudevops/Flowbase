"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot, setTheme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
