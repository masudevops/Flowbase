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
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 border-b border-[#D3DBD8] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#23414F]",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-px shrink-0 bg-[#1D5C8A] dark:bg-[#5FB4E0]" />
          <h1 className="truncate text-xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">{title}</h1>
        </div>
        {description && (
          <p className="mt-1 pl-[13px] text-sm text-[#55707D] dark:text-[#8FA8B3]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">{actions}</div>}
    </div>
  );
}
