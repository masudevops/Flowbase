import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "w-full rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" &&
          "bg-[#0B5CFF] text-white hover:bg-[#0747A6] dark:bg-[#4C9AFF] dark:text-[#0E1624] dark:hover:bg-[#79B1FF]",
        variant === "secondary" &&
          "border border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F6FA] dark:border-[#2A3547] dark:text-[#E4E7EC] dark:hover:bg-[#0E1624]",
        className,
      )}
      {...props}
    />
  );
}
