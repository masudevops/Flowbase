import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#DFE1E6] bg-white dark:border-[#2A3547] dark:bg-[#161D2E]",
        className,
      )}
      {...props}
    />
  );
}
