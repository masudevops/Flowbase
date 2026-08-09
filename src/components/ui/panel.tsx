import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#D3DBD8] bg-white dark:border-[#23414F] dark:bg-[#0F2A3D]",
        className,
      )}
      {...props}
    />
  );
}
