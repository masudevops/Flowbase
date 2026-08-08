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
      cards: [{ title: "Add dark mode toggle", type: "Feature", typeColor: "#2B5FE0" }],
    },
    {
      name: "In Progress",
      cards: [
        { title: "Fix Safari session bug", type: "Bug", typeColor: "#D64545", tag: "High" },
      ],
    },
    {
      name: "Blocked",
      cards: [
        {
          title: "Payment webhook retry",
          type: "Task",
          typeColor: "#6B7280",
          blocked: "Waiting on design review",
        },
      ],
    },
    {
      name: "Done",
      cards: [{ title: "Ship onboarding flow", type: "Feature", typeColor: "#2B5FE0" }],
    },
  ],
  CONSTRUCTION: [
    {
      name: "Scheduled",
      cards: [{ title: "Frame east wall", type: "Task", typeColor: "#6B7280", tag: "Bldg 2" }],
    },
    {
      name: "In Progress",
      cards: [
        { title: "Rough-in plumbing", type: "Task", typeColor: "#6B7280", tag: "Unit 4" },
      ],
    },
    {
      name: "Blocked / Inspection",
      cards: [
        {
          title: "Electrical rough-in",
          type: "Inspection",
          typeColor: "#8B5CF6",
          blocked: "Waiting on inspector",
        },
      ],
    },
    {
      name: "Complete",
      cards: [{ title: "Pour foundation", type: "Task", typeColor: "#6B7280", tag: "Pad C" }],
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
        className="mb-3 inline-flex rounded-md border border-[#D8D3C7] bg-white p-0.5 dark:border-[#2A2F38] dark:bg-[#171B21]"
      >
        {(["IT_DEV", "CONSTRUCTION"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "rounded px-3 py-1.5 font-[family-name:var(--font-plex-mono)] text-xs font-medium tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B5FE0] focus-visible:ring-offset-1",
              mode === option
                ? "bg-[#14181F] text-[#F7F5F0] dark:bg-[#F2F0EA] dark:text-[#0F1216]"
                : "text-[#6B7280] hover:text-[#14181F] dark:hover:text-[#F2F0EA]",
            )}
          >
            {option === "IT_DEV" ? "IT / Dev" : "Construction"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[#D8D3C7] bg-white p-3 shadow-[0_1px_0_#D8D3C7] dark:border-[#2A2F38] dark:bg-[#171B21] dark:shadow-[0_1px_0_#2A2F38]">
        <div key={mode} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DEMO_DATA[mode].map((column, ci) => (
            <div key={column.name} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] leading-tight font-medium tracking-wide text-[#6B7280] uppercase">
                  {column.name}
                </span>
              </div>
              <div className="space-y-2">
                {column.cards.map((card) => (
                  <div
                    key={card.title}
                    className="motion-safe:animate-fade-up rounded-md border border-[#D8D3C7] bg-[#F7F5F0] p-2 text-left dark:border-[#2A2F38] dark:bg-[#0F1216]"
                    style={{ animationDelay: `${ci * 40}ms` }}
                  >
                    <div className="mb-1.5 flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: card.typeColor }}
                      />
                      <span className="font-[family-name:var(--font-plex-mono)] text-[9px] tracking-wide text-[#6B7280] uppercase">
                        {card.type}
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight font-medium text-[#14181F] dark:text-[#F2F0EA]">
                      {card.title}
                    </p>
                    {card.tag && (
                      <span className="mt-1.5 inline-block font-[family-name:var(--font-plex-mono)] text-[9px] text-[#6B7280]">
                        {card.tag}
                      </span>
                    )}
                    {card.blocked && (
                      <div className="mt-1.5 flex items-center gap-1 rounded bg-[#F26B1D]/10 px-1.5 py-1">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#F26B1D]" />
                        <span className="text-[9px] leading-tight text-[#B24F12] dark:text-[#F26B1D]">
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
