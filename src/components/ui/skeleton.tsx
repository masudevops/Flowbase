import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#DFE1E6]/60 dark:bg-[#2A3547]/60", className)}
      {...props}
    />
  );
}
