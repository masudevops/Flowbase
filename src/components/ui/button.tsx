import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1D5C8A] text-white hover:bg-[#123F5C] dark:bg-[#5FB4E0] dark:text-[#0B1F2E] dark:hover:bg-[#8FCBEA]",
  secondary:
    "border border-[#D3DBD8] text-[#14242E] hover:bg-[#EEF2F0] dark:border-[#23414F] dark:text-[#E7EEF0] dark:hover:bg-[#0F2A3D]",
  danger:
    "border border-[#C1440E] text-[#C1440E] hover:bg-[#C1440E]/10 dark:border-[#E8703A] dark:text-[#E8703A] dark:hover:bg-[#E8703A]/10",
  ghost:
    "text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#14242E] dark:text-[#8FA8B3] dark:hover:bg-[#0F2A3D] dark:hover:text-[#E7EEF0]",
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
        "inline-flex w-auto items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5C8A] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-[#5FB4E0] dark:focus-visible:ring-offset-[#0B1F2E]",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
