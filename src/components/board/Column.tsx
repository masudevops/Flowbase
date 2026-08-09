"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { CardPreview } from "./CardPreview";
import { groupCardsByBand, cardsInBand, type GroupBy, type Band } from "./swimlanes";
import type { BoardColumn } from "./types";

export function Column({
  column,
  groupBy,
  bands,
  onOpenCard,
  onAddCard,
}: {
  column: BoardColumn;
  groupBy: GroupBy;
  bands: Band[];
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

  // One SortableContext for the whole column, ordered to match the
  // rendered (band-grouped) layout — dnd-kit's neighbor-based
  // interactions (and Board.tsx's own before/after position math) both
  // rely on `items` order agreeing with what's visually adjacent.
  const orderedCards = groupCardsByBand(column.cards, bands, groupBy);

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
        <SortableContext items={orderedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {groupBy === "none"
            ? orderedCards.map((card) => (
                <CardPreview key={card.id} card={card} isDoneColumn={column.isDoneColumn} onOpen={onOpenCard} />
              ))
            : bands.map((band) => {
                const cards = cardsInBand(column.cards, band, groupBy);
                if (cards.length === 0) return null;
                return (
                  <div key={band.key} className="space-y-2">
                    <p className="px-0.5 text-[10px] font-medium tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                      {band.label} <span className="normal-case">({cards.length})</span>
                    </p>
                    {cards.map((card) => (
                      <CardPreview
                        key={card.id}
                        card={card}
                        isDoneColumn={column.isDoneColumn}
                        onOpen={onOpenCard}
                      />
                    ))}
                  </div>
                );
              })}
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
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] text-[#5E6C84] hover:bg-[#DFE1E6]/50 dark:text-[#8C9BAB] dark:hover:bg-[#2A3547]/50"
          >
            <Plus className="h-4 w-4" />
            Add card
          </button>
        )}
      </div>
    </div>
  );
}
