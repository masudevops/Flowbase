import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0B5CFF] text-white hover:bg-[#0747A6] dark:bg-[#4C9AFF] dark:text-[#0E1624] dark:hover:bg-[#79B1FF]",
  secondary:
    "border border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F6FA] dark:border-[#2A3547] dark:text-[#E4E7EC] dark:hover:bg-[#161D2E]",
  danger:
    "border border-[#DE350B] text-[#DE350B] hover:bg-[#DE350B]/10 dark:border-[#FF5630] dark:text-[#FF5630] dark:hover:bg-[#FF5630]/10",
  ghost:
    "text-[#5E6C84] hover:bg-[#F4F6FA] hover:text-[#172B4D] dark:text-[#8C9BAB] dark:hover:bg-[#161D2E] dark:hover:text-[#E4E7EC]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-[13px]",
  md: "px-3 py-2 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex w-auto items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
