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
      cards: [{ title: "Add dark mode toggle", type: "Feature", typeColor: "#1D5C8A" }],
    },
    {
      name: "In Progress",
      cards: [
        { title: "Fix Safari session bug", type: "Bug", typeColor: "#C1440E", tag: "High" },
      ],
    },
    {
      name: "Blocked",
      cards: [
        {
          title: "Payment webhook retry",
          type: "Task",
          typeColor: "#55707D",
          blocked: "Waiting on design review",
        },
      ],
    },
    {
      name: "Done",
      cards: [{ title: "Ship onboarding flow", type: "Feature", typeColor: "#1D5C8A" }],
    },
  ],
  CONSTRUCTION: [
    {
      name: "Scheduled",
      cards: [{ title: "Frame east wall", type: "Task", typeColor: "#55707D", tag: "Bldg 2" }],
    },
    {
      name: "In Progress",
      cards: [
        { title: "Rough-in plumbing", type: "Task", typeColor: "#55707D", tag: "Unit 4" },
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
      cards: [{ title: "Pour foundation", type: "Task", typeColor: "#55707D", tag: "Pad C" }],
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
        className="mb-3 inline-flex rounded-md border border-[#D3DBD8] bg-white p-0.5 dark:border-[#23414F] dark:bg-[#0F2A3D]"
      >
        {(["IT_DEV", "CONSTRUCTION"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "rounded px-3 py-1.5 font-[family-name:var(--font-plex-mono)] text-xs font-medium tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5C8A] focus-visible:ring-offset-1",
              mode === option
                ? "bg-[#1D5C8A] text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]"
                : "text-[#55707D] hover:text-[#14242E] dark:text-[#8FA8B3] dark:hover:text-[#E7EEF0]",
            )}
          >
            {option === "IT_DEV" ? "IT / Dev" : "Construction"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[#D3DBD8] bg-white p-3 shadow-[0_1px_0_#D3DBD8] dark:border-[#23414F] dark:bg-[#0F2A3D] dark:shadow-[0_1px_0_#23414F]">
        <div key={mode} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DEMO_DATA[mode].map((column, ci) => (
            <div key={column.name} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] leading-tight font-medium tracking-wide text-[#55707D] uppercase dark:text-[#8FA8B3]">
                  {column.name}
                </span>
              </div>
              <div className="space-y-2">
                {column.cards.map((card) => (
                  <div
                    key={card.title}
                    className="motion-safe:animate-fade-up rounded-md border border-[#D3DBD8] bg-[#EEF2F0] p-2 text-left dark:border-[#23414F] dark:bg-[#0B1F2E]"
                    style={{ animationDelay: `${ci * 40}ms` }}
                  >
                    <div className="mb-1.5 flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: card.typeColor }}
                      />
                      <span className="font-[family-name:var(--font-plex-mono)] text-[9px] tracking-wide text-[#55707D] uppercase dark:text-[#8FA8B3]">
                        {card.type}
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight font-medium text-[#14242E] dark:text-[#E7EEF0]">
                      {card.title}
                    </p>
                    {card.tag && (
                      <span className="mt-1.5 inline-block font-[family-name:var(--font-plex-mono)] text-[9px] text-[#55707D] dark:text-[#8FA8B3]">
                        {card.tag}
                      </span>
                    )}
                    {card.blocked && (
                      <div className="mt-1.5 flex items-center gap-1 rounded bg-[#C1440E]/10 px-1.5 py-1 dark:bg-[#E8703A]/15">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#C1440E] dark:bg-[#E8703A]" />
                        <span className="text-[9px] leading-tight text-[#C1440E] dark:text-[#E8703A]">
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
