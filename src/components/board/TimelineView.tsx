"use client";

import { useMemo, useState } from "react";
import { Ban } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { CardDetailPanel } from "@/components/card-detail/CardDetailPanel";
import { PRIORITY_META } from "./types";
import type { CardTypeOption, MemberOption, LabelOption, ContactOption } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_WIDTH = 32;
// A single rolling window, no zoom levels — enough to ship a useful v1
// (see docs/roadmap/06-timeline-view.md non-goals).
const RANGE_DAYS_BEFORE = 14;
const RANGE_DAYS_AFTER = 42;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayOffset(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function TimelineView({
  boardId,
  cardTypes,
  members,
  labels,
  contacts,
}: {
  boardId: string;
  cardTypes: CardTypeOption[];
  members: MemberOption[];
  labels: LabelOption[];
  contacts: ContactOption[];
}) {
  const utils = trpc.useUtils();
  const { data: cards } = trpc.card.listByBoard.useQuery({ boardId });
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  useRealtimeBoard(boardId, () => utils.card.listByBoard.invalidate({ boardId }));

  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeStart = useMemo(
    () => new Date(today.getTime() - RANGE_DAYS_BEFORE * DAY_MS),
    [today],
  );
  const rangeDays = RANGE_DAYS_BEFORE + RANGE_DAYS_AFTER;

  const scheduled = useMemo(
    () => (cards ?? []).filter((c) => c.startDate || c.dueDate),
    [cards],
  );
  const unscheduled = useMemo(
    () => (cards ?? []).filter((c) => !c.startDate && !c.dueDate),
    [cards],
  );

  const days = useMemo(
    () => Array.from({ length: rangeDays }, (_, i) => new Date(rangeStart.getTime() + i * DAY_MS)),
    [rangeStart, rangeDays],
  );

  const todayOffset = dayOffset(rangeStart, today);

  return (
    <div>
      <div className="thin-scrollbar overflow-x-auto rounded-md border border-[#DFE1E6] dark:border-[#2A3547]">
        <div style={{ width: rangeDays * DAY_WIDTH }}>
          {/* Date axis header */}
          <div className="sticky top-0 z-10 flex border-b border-[#DFE1E6] bg-[#F4F6FA] dark:border-[#2A3547] dark:bg-[#0E1624]">
            {days.map((day, i) => (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center border-r border-[#DFE1E6] py-1 text-[10px] text-[#5E6C84] last:border-r-0 dark:border-[#2A3547] dark:text-[#8C9BAB]"
                style={{ width: DAY_WIDTH }}
              >
                <span>{day.getDate() === 1 ? day.toLocaleDateString(undefined, { month: "short" }) : " "}</span>
                <span className={i === todayOffset ? "font-semibold text-[#0B5CFF] dark:text-[#4C9AFF]" : ""}>
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
            {/* Today marker */}
            {todayOffset >= 0 && todayOffset < rangeDays && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#0B5CFF] dark:bg-[#4C9AFF]"
                style={{ left: todayOffset * DAY_WIDTH }}
              />
            )}

            {scheduled.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
                No cards with a start or due date yet.
              </p>
            )}

            {scheduled.map((card) => {
              const start = card.startDate ? new Date(card.startDate) : new Date(card.dueDate!);
              const end = card.dueDate ? new Date(card.dueDate) : start;
              const barStartOffset = dayOffset(rangeStart, start);
              const barEndOffset = dayOffset(rangeStart, end);
              const left = Math.max(barStartOffset, 0) * DAY_WIDTH;
              const widthDays = Math.max(barEndOffset - Math.max(barStartOffset, 0) + 1, 1);
              const width = Math.min(widthDays, rangeDays - Math.max(barStartOffset, 0)) * DAY_WIDTH;

              if (barEndOffset < 0 || barStartOffset >= rangeDays) return null;

              return (
                <div key={card.id} className="flex h-9 items-center border-b border-[#DFE1E6] last:border-0 dark:border-[#2A3547]">
                  <button
                    type="button"
                    onClick={() => setOpenCardId(card.id)}
                    className="relative flex h-6 items-center gap-1 truncate rounded px-2 text-left text-[11px] font-medium text-white"
                    style={{ backgroundColor: PRIORITY_META[card.priority].color, marginLeft: left, width: Math.max(width - 4, 24) }}
                    title={card.title}
                  >
                    {card.isBlocked && <Ban className="h-2.5 w-2.5 shrink-0" />}
                    <span className="truncate">{card.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            No start or due date ({unscheduled.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setOpenCardId(card.id)}
                className="rounded-md border border-[#DFE1E6] bg-white px-2 py-1 text-xs font-medium text-[#172B4D] dark:border-[#2A3547] dark:bg-[#161D2E] dark:text-[#E4E7EC]"
              >
                {card.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {openCardId && (
        <CardDetailPanel
          cardId={openCardId}
          cardTypes={cardTypes}
          members={members}
          labels={labels}
          contacts={contacts}
          onClose={() => setOpenCardId(null)}
          onChanged={() => {}}
          onOpenCard={setOpenCardId}
        />
      )}
    </div>
  );
}
