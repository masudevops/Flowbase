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
      {/* "Title block" header — the drafting-plate corner tick and
          baseline rule are the board's signature detail, standing in
          for the generic plain-text column label used everywhere else
          in this genre of app. */}
      <div className="mb-3 border-b border-[#D3DBD8] px-0.5 pb-1.5 dark:border-[#23414F]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-px shrink-0 bg-[#1D5C8A] dark:bg-[#5FB4E0]" />
          <span className="font-[family-name:var(--font-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-[#14242E] uppercase dark:text-[#E7EEF0]">
            {column.name}
          </span>
          <span className="font-[family-name:var(--font-plex-mono)] text-[11px] text-[#55707D] dark:text-[#8FA8B3]">
            {String(column.cards.length).padStart(2, "0")}
          </span>
          {column.isBlockedColumn && (
            <span className="rounded bg-[#C1440E]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#C1440E] dark:bg-[#E8703A]/15 dark:text-[#E8703A]">
              blocked
            </span>
          )}
          {column.isDoneColumn && (
            <span className="rounded bg-[#0F7A5C]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#0F7A5C] dark:bg-[#3FBF95]/15 dark:text-[#3FBF95]">
              done
            </span>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-md border border-transparent p-1.5 transition-colors",
          isOver && "border-[#1D5C8A] bg-[#1D5C8A]/5 dark:border-[#5FB4E0] dark:bg-[#5FB4E0]/10",
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
                    <p className="px-0.5 text-[10px] font-medium tracking-wide text-[#55707D] uppercase dark:text-[#8FA8B3]">
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
          <div className="rounded-md border border-[#D3DBD8] bg-white p-2 dark:border-[#23414F] dark:bg-[#0F2A3D]">
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
              className="w-full resize-none bg-transparent text-[13px] text-[#14242E] outline-none dark:text-[#E7EEF0]"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] text-[#55707D] hover:bg-[#D3DBD8]/50 dark:text-[#8FA8B3] dark:hover:bg-[#23414F]/50"
          >
            <Plus className="h-4 w-4" />
            Add card
          </button>
        )}
      </div>
    </div>
  );
}
