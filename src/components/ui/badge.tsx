import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "blue" | "red" | "orange" | "green" | "purple";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-[#55707D]/10 text-[#55707D] dark:bg-[#8FA8B3]/15 dark:text-[#8FA8B3]",
  blue: "bg-[#1D5C8A]/10 text-[#1D5C8A] dark:bg-[#5FB4E0]/15 dark:text-[#5FB4E0]",
  red: "bg-[#C1440E]/10 text-[#C1440E] dark:bg-[#E8703A]/15 dark:text-[#E8703A]",
  orange: "bg-[#D98324]/10 text-[#9C5A1A] dark:bg-[#D98324]/15 dark:text-[#D98324]",
  green: "bg-[#0F7A5C]/10 text-[#0F7A5C] dark:bg-[#3FBF95]/15 dark:text-[#3FBF95]",
  purple: "bg-[#6554C0]/10 text-[#6554C0] dark:bg-[#8777D9]/15 dark:text-[#8777D9]",
};

/// Converts a #rrggbb hex string to an rgba() string at the given alpha —
/// used for the handful of badges whose color is user-picked data (card
/// types, labels) rather than one of the fixed semantic tones above.
function hexToRgba(hex: string, alpha: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Badge({
  tone = "neutral",
  color,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; color?: string }) {
  const dynamicStyle = color
    ? { backgroundColor: hexToRgba(color, 0.12), color, ...style }
    : style;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
        !color && TONES[tone],
        className,
      )}
      style={dynamicStyle}
      {...props}
    />
  );
}
