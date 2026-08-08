"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, ArrowUpDown, Ban } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { CardDetailPanel } from "@/components/card-detail/CardDetailPanel";
import { PRIORITY_META } from "./types";
import type { CardTypeOption, MemberOption, LabelOption, ContactOption } from "./types";

type SortKey = "priority" | "dueDate" | "title";

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function BacklogView({
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

  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const filtered = useMemo(() => {
    if (!cards) return [];

    let result = cards;
    if (assigneeFilter) {
      result = result.filter((c) => c.assigneeId === assigneeFilter);
    }
    if (priorityFilter) {
      result = result.filter((c) => c.priority === priorityFilter);
    }
    if (labelFilter) {
      result = result.filter((c) => c.labels.some((l) => l.label.id === labelFilter));
    }
    if (blockedOnly) {
      result = result.filter((c) => c.isBlocked);
    }

    return [...result].sort((a, b) => {
      if (sortKey === "priority") {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }
      if (sortKey === "dueDate") {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aTime - bTime;
      }
      return a.title.localeCompare(b.title);
    });
  }, [cards, assigneeFilter, priorityFilter, labelFilter, blockedOnly, sortKey]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#5E6C84] dark:text-[#8C9BAB]" />
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.fullName ?? m.email}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
        >
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>

        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
        >
          <option value="">All labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-[#172B4D] dark:text-[#E4E7EC]">
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(e) => setBlockedOnly(e.target.checked)}
          />
          Blocked only
        </label>

        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-[#5E6C84] dark:text-[#8C9BAB]" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
          >
            <option value="priority">Sort: Priority</option>
            <option value="dueDate">Sort: Due date</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-[#DFE1E6] dark:border-[#2A3547]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DFE1E6] bg-[#F4F6FA] text-left text-xs text-[#5E6C84] dark:border-[#2A3547] dark:bg-[#0E1624] dark:text-[#8C9BAB]">
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Assignee</th>
              <th className="px-3 py-2 font-medium">Due</th>
              <th className="px-3 py-2 font-medium">Blocked</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((card) => (
              <tr
                key={card.id}
                onClick={() => setOpenCardId(card.id)}
                className="cursor-pointer border-b border-[#DFE1E6] last:border-0 hover:bg-[#F4F6FA] dark:border-[#2A3547] dark:hover:bg-[#0E1624]"
              >
                <td className="px-3 py-2 font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                  {card.title}
                </td>
                <td className="px-3 py-2 text-[#5E6C84] dark:text-[#8C9BAB]">
                  {card.cardType?.name ?? "—"}
                </td>
                <td
                  className="px-3 py-2 font-medium"
                  style={{ color: PRIORITY_META[card.priority].color }}
                >
                  {PRIORITY_META[card.priority].label}
                </td>
                <td className="px-3 py-2 text-[#5E6C84] dark:text-[#8C9BAB]">
                  {card.assignee
                    ? (card.assignee.fullName ?? card.assignee.email)
                    : card.assigneeContact
                      ? `${card.assigneeContact.name} (contact)`
                      : "Unassigned"}
                </td>
                <td className="px-3 py-2 text-[#5E6C84] dark:text-[#8C9BAB]">
                  {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2">
                  {card.isBlocked && (
                    <span className="flex w-fit items-center gap-1 rounded bg-[#DE350B]/10 px-1.5 py-0.5 text-xs text-[#DE350B] dark:bg-[#FF5630]/15 dark:text-[#FF5630]">
                      <Ban className="h-3 w-3" />
                      Blocked
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[#5E6C84] dark:text-[#8C9BAB]">
                  No cards match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
