import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer rounded border-[#DFE1E6] text-[#0B5CFF] accent-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF] focus:outline-none dark:border-[#2A3547] dark:bg-[#0E1624]",
        className,
      )}
      {...props}
    />
  );
}
