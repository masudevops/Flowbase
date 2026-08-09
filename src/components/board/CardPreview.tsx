"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Flag, ListChecks, MessageSquare, Ban, Layers, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { isCardOverdue } from "@/lib/dates";
import { assigneeId, assigneeName, assigneeInitial } from "./assignees";
import type { BoardCard } from "./types";
import { PRIORITY_META } from "./types";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const MAX_VISIBLE_ASSIGNEES = 3;

export function CardPreview({
  card,
  isDoneColumn,
  onOpen,
}: {
  card: BoardCard;
  /// Whether the column this card is currently rendered in is a "done"
  /// column — needed so a past due date on finished work doesn't read
  /// as overdue (same rule My Work already applies).
  isDoneColumn: boolean;
  onOpen: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const checklistTotal = card.checklistItems.length;
  const checklistDone = card.checklistItems.filter((i) => i.isDone).length;
  const childrenTotal = card.children.length;
  const childrenDone = card.children.filter((c) => c.column.isDoneColumn).length;
  const priority = PRIORITY_META[card.priority];
  const overdue = isCardOverdue(card.dueDate, isDoneColumn);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card.id)}
      className={cn(
        "cursor-pointer rounded-md border border-[#DFE1E6] bg-white p-2.5 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CFF] dark:border-[#2A3547] dark:bg-[#161D2E] dark:focus-visible:ring-[#4C9AFF]",
        isDragging && "opacity-40",
      )}
    >
      {card.cardType && (
        <div className="mb-1 flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: card.cardType.color }}
          />
          <span className="font-[family-name:var(--font-plex-mono)] text-[9px] tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
            {card.cardType.name}
          </span>
        </div>
      )}

      <p className="text-[13px] leading-snug font-medium text-[#172B4D] dark:text-[#E4E7EC]">
        {card.title}
      </p>

      {card.labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {card.labels.map(({ label }) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {card.isBlocked && (
        <div className="mt-1.5 flex items-center gap-1 rounded bg-[#DE350B]/10 px-1.5 py-1 dark:bg-[#FF5630]/15">
          <Ban className="h-3 w-3 shrink-0 text-[#DE350B] dark:text-[#FF5630]" />
          <span className="truncate text-[9px] leading-tight text-[#DE350B] dark:text-[#FF5630]">
            {card.blockedByCard ? `Blocked by "${card.blockedByCard.title}"` : card.blockedReason || "Blocked"}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-[#5E6C84] dark:text-[#8C9BAB]">
          <span
            className="flex items-center gap-1 font-medium"
            style={{ color: priority.color }}
          >
            <Flag className="h-3 w-3" />
            {priority.label}
          </span>
          {card.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "font-medium text-[#DE350B] dark:text-[#FF5630]",
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(card.dueDate).toLocaleDateString(undefined, DATE_FORMAT)}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {checklistDone}/{checklistTotal}
            </span>
          )}
          {childrenTotal > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {childrenDone}/{childrenTotal}
            </span>
          )}
          {card._count.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {card._count.comments}
            </span>
          )}
        </div>

        {card.assignees.length > 0 && (
          <div className="flex shrink-0 items-center">
            {card.assignees.slice(0, MAX_VISIBLE_ASSIGNEES).map((a, i) => (
              <span
                key={assigneeId(a)}
                title={assigneeName(a)}
                style={{ marginLeft: i === 0 ? 0 : "-6px", zIndex: MAX_VISIBLE_ASSIGNEES - i }}
                className={cn(
                  "relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ring-2 ring-white dark:ring-[#161D2E]",
                  a.user
                    ? "bg-[#0B5CFF] text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
                    : "border border-dashed border-[#5E6C84] bg-white text-[#5E6C84] dark:border-[#8C9BAB] dark:bg-[#161D2E] dark:text-[#8C9BAB]",
                )}
              >
                {assigneeInitial(a)}
              </span>
            ))}
            {card.assignees.length > MAX_VISIBLE_ASSIGNEES && (
              <span
                title={card.assignees
                  .slice(MAX_VISIBLE_ASSIGNEES)
                  .map((a) => assigneeName(a))
                  .join(", ")}
                style={{ marginLeft: "-6px" }}
                className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#DFE1E6] text-[9px] font-medium text-[#5E6C84] ring-2 ring-white dark:bg-[#2A3547] dark:text-[#8C9BAB] dark:ring-[#161D2E]"
              >
                +{card.assignees.length - MAX_VISIBLE_ASSIGNEES}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
