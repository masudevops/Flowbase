import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-md border border-[#DFE1E6] bg-white py-2 pr-8 pl-3 text-sm text-[#172B4D] focus:ring-2 focus:ring-[#0B5CFF] focus:outline-none dark:border-[#2A3547] dark:bg-[#0E1624] dark:text-[#E4E7EC]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#5E6C84] dark:text-[#8C9BAB]" />
    </div>
  );
}
