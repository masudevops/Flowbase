import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-[#D3DBD8] bg-white px-3 py-2 text-sm text-[#14242E] placeholder:text-[#55707D]/60 focus:ring-2 focus:ring-[#1D5C8A] focus:outline-none dark:border-[#23414F] dark:bg-[#0B1F2E] dark:text-[#E7EEF0]",
        className,
      )}
      {...props}
    />
  );
}
