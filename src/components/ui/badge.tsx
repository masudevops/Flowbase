import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "blue" | "red" | "orange" | "green" | "purple";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-[#5E6C84]/10 text-[#5E6C84] dark:bg-[#8C9BAB]/15 dark:text-[#8C9BAB]",
  blue: "bg-[#0B5CFF]/10 text-[#0B5CFF] dark:bg-[#4C9AFF]/15 dark:text-[#4C9AFF]",
  red: "bg-[#DE350B]/10 text-[#DE350B] dark:bg-[#FF5630]/15 dark:text-[#FF5630]",
  orange: "bg-[#FF991F]/10 text-[#B5680A] dark:bg-[#FF991F]/15 dark:text-[#FF991F]",
  green: "bg-[#00875A]/10 text-[#00875A] dark:bg-[#36B37E]/15 dark:text-[#36B37E]",
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
