"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown, Ban, Calendar, Kanban } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { isCardOverdue } from "@/lib/dates";
import { PRIORITY_META } from "./types";

type MyWorkCard = {
  id: string;
  organizationId: string;
  boardId: string;
  columnId: string;
  cardTypeId: string | null;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate: Date | null;
  dueDate: Date | null;
  assigneeId: string | null;
  assigneeContactId: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedByCardId: string | null;
  location: string | null;
  parentCardId: string | null;
  position: string;
  approverId: string | null;
  approvedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  board: { id: string; name: string };
  column: { name: string; isDoneColumn: boolean };
  cardType: { name: string; color: string } | null;
};

type SortKey = "dueDate" | "priority" | "board";

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function MyWorkView({
  organizationId,
  orgSlug,
  initialCards,
}: {
  organizationId: string;
  orgSlug: string;
  initialCards: MyWorkCard[];
}) {
  const router = useRouter();
  const { data: cards } = trpc.card.listAssignedToMe.useQuery(
    { organizationId },
    { initialData: initialCards },
  );

  const [blockedOnly, setBlockedOnly] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [boardFilter, setBoardFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");

  const boards = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cards) map.set(c.board.id, c.board.name);
    return [...map.entries()];
  }, [cards]);

  const filtered = useMemo(() => {
    let result = cards;
    if (!showCompleted) result = result.filter((c) => !c.column.isDoneColumn);
    if (blockedOnly) result = result.filter((c) => c.isBlocked);
    if (boardFilter) result = result.filter((c) => c.board.id === boardFilter);

    return [...result].sort((a, b) => {
      if (sortKey === "priority") {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }
      if (sortKey === "board") {
        return a.board.name.localeCompare(b.board.name);
      }
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [cards, showCompleted, blockedOnly, boardFilter, sortKey]);

  function openCard(card: MyWorkCard) {
    router.push(`/w/${orgSlug}/boards/${card.board.id}?card=${card.id}`);
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D3DBD8] py-16 text-center dark:border-[#23414F]">
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
          Nothing assigned to you right now.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#55707D] dark:text-[#8FA8B3]" />

        {boards.length > 1 && (
          <Select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="w-auto"
          >
            <option value="">All boards</option>
            {boards.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        )}

        <label className="flex items-center gap-1.5 text-sm text-[#14242E] dark:text-[#E7EEF0]">
          <Checkbox checked={blockedOnly} onChange={(e) => setBlockedOnly(e.target.checked)} />
          Blocked only
        </label>

        <label className="flex items-center gap-1.5 text-sm text-[#14242E] dark:text-[#E7EEF0]">
          <Checkbox checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          Show completed
        </label>

        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-[#55707D] dark:text-[#8FA8B3]" />
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="w-auto"
          >
            <option value="dueDate">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="board">Sort: Board</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#D3DBD8] py-16 text-center dark:border-[#23414F]">
          <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
            No work matches these filters.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((card) => {
            const overdue = isCardOverdue(card.dueDate, card.column.isDoneColumn);
            const priority = PRIORITY_META[card.priority];
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => openCard(card)}
                className="flex w-full flex-col gap-2 rounded-md border border-[#D3DBD8] bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-[#23414F] dark:bg-[#0F2A3D]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {card.cardType && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: card.cardType.color }}
                      />
                    )}
                    <span className="truncate text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
                      {card.title}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                    <span className="flex items-center gap-1">
                      <Kanban className="h-3 w-3" />
                      {card.board.name}
                    </span>
                    <span>{card.column.name}</span>
                    {card.cardType && <span>{card.cardType.name}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-medium" style={{ color: priority.color }}>
                    {priority.label}
                  </span>
                  {card.dueDate && (
                    <span
                      className={
                        overdue
                          ? "flex items-center gap-1 font-medium text-[#C1440E] dark:text-[#E8703A]"
                          : "flex items-center gap-1 text-[#55707D] dark:text-[#8FA8B3]"
                      }
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(card.dueDate).toLocaleDateString()}
                      {overdue && " (overdue)"}
                    </span>
                  )}
                  {card.isBlocked && (
                    <span className="flex items-center gap-1 rounded bg-[#C1440E]/10 px-1.5 py-0.5 text-[#C1440E] dark:bg-[#E8703A]/15 dark:text-[#E8703A]">
                      <Ban className="h-3 w-3" />
                      Blocked
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
