"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { CardDetailPanel } from "@/components/card-detail/CardDetailPanel";
import { PRIORITY_META } from "./types";
import type { CardTypeOption, MemberOption, LabelOption, ContactOption } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CalendarView({
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

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const cardsByDay = useMemo(() => {
    const map = new Map<string, typeof cards>();
    if (!cards) return map;
    for (const card of cards) {
      if (!card.dueDate) continue;
      const key = isoDateKey(new Date(card.dueDate));
      const existing = map.get(key) ?? [];
      existing.push(card);
      map.set(key, existing);
    }
    return map;
  }, [cards]);

  const undated = useMemo(() => (cards ?? []).filter((c) => !c.dueDate), [cards]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = isoDateKey(today);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded p-1.5 text-[#55707D] hover:bg-[#EEF2F0] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-md border border-[#D3DBD8] px-2 py-1 text-xs font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded p-1.5 text-[#55707D] hover:bg-[#EEF2F0] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-[#D3DBD8] dark:border-[#23414F]">
        <div className="grid grid-cols-7 border-b border-[#D3DBD8] bg-[#EEF2F0] dark:border-[#23414F] dark:bg-[#0B1F2E]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-1.5 text-center text-xs font-medium text-[#55707D] dark:text-[#8FA8B3]"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const key = date ? isoDateKey(date) : `blank-${i}`;
            const dayCards = date ? (cardsByDay.get(isoDateKey(date)) ?? []) : [];
            const isToday = date && isoDateKey(date) === todayKey;
            return (
              <div
                key={key}
                className="min-h-[92px] border-b border-r border-[#D3DBD8] p-1.5 last:border-r-0 dark:border-[#23414F] [&:nth-child(7n)]:border-r-0"
              >
                {date && (
                  <>
                    <span
                      className={
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#1D5C8A] text-[11px] font-semibold text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]"
                          : "text-xs text-[#55707D] dark:text-[#8FA8B3]"
                      }
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayCards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setOpenCardId(card.id)}
                          className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] font-medium text-white"
                          style={{ backgroundColor: PRIORITY_META[card.priority].color }}
                          title={card.title}
                        >
                          {card.isBlocked && <Ban className="h-2.5 w-2.5 shrink-0" />}
                          <span className="truncate">{card.title}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-medium text-[#55707D] dark:text-[#8FA8B3]">
            No due date ({undated.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {undated.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setOpenCardId(card.id)}
                className="rounded-md border border-[#D3DBD8] bg-white px-2 py-1 text-xs font-medium text-[#14242E] dark:border-[#23414F] dark:bg-[#0F2A3D] dark:text-[#E7EEF0]"
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
