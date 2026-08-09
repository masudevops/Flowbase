import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-md border border-[#D3DBD8] bg-white py-2 pr-8 pl-3 text-sm text-[#14242E] focus:ring-2 focus:ring-[#1D5C8A] focus:outline-none dark:border-[#23414F] dark:bg-[#0B1F2E] dark:text-[#E7EEF0]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#55707D] dark:text-[#8FA8B3]" />
    </div>
  );
}
