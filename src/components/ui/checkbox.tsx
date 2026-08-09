import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer rounded border-[#D3DBD8] text-[#1D5C8A] accent-[#1D5C8A] focus:ring-2 focus:ring-[#1D5C8A] focus:outline-none dark:border-[#23414F] dark:bg-[#0B1F2E]",
        className,
      )}
      {...props}
    />
  );
}
