import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">{actions}</div>}
    </div>
  );
}
