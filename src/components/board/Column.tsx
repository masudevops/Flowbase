"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { CardPreview } from "./CardPreview";
import type { BoardColumn } from "./types";

export function Column({
  column,
  onOpenCard,
  onAddCard,
}: {
  column: BoardColumn;
  onOpenCard: (cardId: string) => void;
  onAddCard: (columnId: string, title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  function submit() {
    const trimmed = title.trim();
    if (trimmed) {
      onAddCard(column.id, trimmed);
    }
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
          {column.name}
        </span>
        <span className="text-[11px] text-[#5E6C84] dark:text-[#8C9BAB]">
          {column.cards.length}
        </span>
        {column.isBlockedColumn && (
          <span className="rounded bg-[#DE350B]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#DE350B] dark:bg-[#FF5630]/15 dark:text-[#FF5630]">
            blocked
          </span>
        )}
        {column.isDoneColumn && (
          <span className="rounded bg-[#00875A]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#00875A] dark:bg-[#36B37E]/15 dark:text-[#36B37E]">
            done
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-md border border-transparent p-1.5 transition-colors",
          isOver && "border-[#0B5CFF] bg-[#0B5CFF]/5 dark:border-[#4C9AFF] dark:bg-[#4C9AFF]/10",
        )}
      >
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <CardPreview key={card.id} card={card} onOpen={onOpenCard} />
          ))}
        </SortableContext>

        {adding ? (
          <div className="rounded-md border border-[#DFE1E6] bg-white p-2 dark:border-[#2A3547] dark:bg-[#161D2E]">
            <textarea
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
                if (e.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
              onBlur={submit}
              placeholder="Card title"
              rows={2}
              className="w-full resize-none bg-transparent text-[13px] text-[#172B4D] outline-none dark:text-[#E4E7EC]"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-md px-2 py-1.5 text-left text-[13px] text-[#5E6C84] hover:bg-[#DFE1E6]/50 dark:text-[#8C9BAB] dark:hover:bg-[#2A3547]/50"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
