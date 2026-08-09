import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-[#DFE1E6] bg-white px-3 py-2 text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:ring-2 focus:ring-[#0B5CFF] focus:outline-none dark:border-[#2A3547] dark:bg-[#0E1624] dark:text-[#E4E7EC]",
        className,
      )}
      {...props}
    />
  );
}
