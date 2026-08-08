"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type DemoCard = {
  title: string;
  type: string;
  typeColor: string;
  tag?: string;
  blocked?: string;
};

type DemoColumn = {
  name: string;
  cards: DemoCard[];
};

type DemoMode = "IT_DEV" | "CONSTRUCTION";

const DEMO_DATA: Record<DemoMode, DemoColumn[]> = {
  IT_DEV: [
    {
      name: "To Do",
      cards: [{ title: "Add dark mode toggle", type: "Feature", typeColor: "#0B5CFF" }],
    },
    {
      name: "In Progress",
      cards: [
        { title: "Fix Safari session bug", type: "Bug", typeColor: "#DE350B", tag: "High" },
      ],
    },
    {
      name: "Blocked",
      cards: [
        {
          title: "Payment webhook retry",
          type: "Task",
          typeColor: "#5E6C84",
          blocked: "Waiting on design review",
        },
      ],
    },
    {
      name: "Done",
      cards: [{ title: "Ship onboarding flow", type: "Feature", typeColor: "#0B5CFF" }],
    },
  ],
  CONSTRUCTION: [
    {
      name: "Scheduled",
      cards: [{ title: "Frame east wall", type: "Task", typeColor: "#5E6C84", tag: "Bldg 2" }],
    },
    {
      name: "In Progress",
      cards: [
        { title: "Rough-in plumbing", type: "Task", typeColor: "#5E6C84", tag: "Unit 4" },
      ],
    },
    {
      name: "Blocked / Inspection",
      cards: [
        {
          title: "Electrical rough-in",
          type: "Inspection",
          typeColor: "#6554C0",
          blocked: "Waiting on inspector",
        },
      ],
    },
    {
      name: "Complete",
      cards: [{ title: "Pour foundation", type: "Task", typeColor: "#5E6C84", tag: "Pad C" }],
    },
  ],
};

export function BoardDemo() {
  const [mode, setMode] = useState<DemoMode>("IT_DEV");

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Board vocabulary"
        className="mb-3 inline-flex rounded-md border border-[#DFE1E6] bg-white p-0.5 dark:border-[#2A3547] dark:bg-[#161D2E]"
      >
        {(["IT_DEV", "CONSTRUCTION"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "rounded px-3 py-1.5 font-[family-name:var(--font-plex-mono)] text-xs font-medium tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CFF] focus-visible:ring-offset-1",
              mode === option
                ? "bg-[#0B5CFF] text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
                : "text-[#5E6C84] hover:text-[#172B4D] dark:text-[#8C9BAB] dark:hover:text-[#E4E7EC]",
            )}
          >
            {option === "IT_DEV" ? "IT / Dev" : "Construction"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[#DFE1E6] bg-white p-3 shadow-[0_1px_0_#DFE1E6] dark:border-[#2A3547] dark:bg-[#161D2E] dark:shadow-[0_1px_0_#2A3547]">
        <div key={mode} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DEMO_DATA[mode].map((column, ci) => (
            <div key={column.name} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] leading-tight font-medium tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                  {column.name}
                </span>
              </div>
              <div className="space-y-2">
                {column.cards.map((card) => (
                  <div
                    key={card.title}
                    className="motion-safe:animate-fade-up rounded-md border border-[#DFE1E6] bg-[#F4F6FA] p-2 text-left dark:border-[#2A3547] dark:bg-[#0E1624]"
                    style={{ animationDelay: `${ci * 40}ms` }}
                  >
                    <div className="mb-1.5 flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: card.typeColor }}
                      />
                      <span className="font-[family-name:var(--font-plex-mono)] text-[9px] tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                        {card.type}
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                      {card.title}
                    </p>
                    {card.tag && (
                      <span className="mt-1.5 inline-block font-[family-name:var(--font-plex-mono)] text-[9px] text-[#5E6C84] dark:text-[#8C9BAB]">
                        {card.tag}
                      </span>
                    )}
                    {card.blocked && (
                      <div className="mt-1.5 flex items-center gap-1 rounded bg-[#DE350B]/10 px-1.5 py-1 dark:bg-[#FF5630]/15">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#DE350B] dark:bg-[#FF5630]" />
                        <span className="text-[9px] leading-tight text-[#DE350B] dark:text-[#FF5630]">
                          {card.blocked}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
