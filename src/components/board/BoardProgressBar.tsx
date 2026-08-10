"use client";

import type { BoardColumn } from "./types";

export function BoardProgressBar({
  columns,
  onSegmentClick,
}: {
  columns: BoardColumn[];
  onSegmentClick: (columnId: string) => void;
}) {
  const total = columns.reduce((sum, col) => sum + col.cards.length, 0);
  if (total === 0) return null;

  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-[#D3DBD8] dark:bg-[#23414F]">
        {columns.map((col) => {
          const count = col.cards.length;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => onSegmentClick(col.id)}
              title={`${col.name}: ${count} card${count === 1 ? "" : "s"}`}
              style={{ width: `${pct}%` }}
              className={
                col.isDoneColumn
                  ? "h-full bg-[#0F7A5C] transition-opacity hover:opacity-80 dark:bg-[#3FBF95]"
                  : "h-full bg-[#1D5C8A] transition-opacity hover:opacity-80 dark:bg-[#5FB4E0]"
              }
            />
          );
        })}
      </div>
      <span className="shrink-0 font-[family-name:var(--font-plex-mono)] text-[10px] text-[#55707D] dark:text-[#8FA8B3]">
        {String(total).padStart(2, "0")} CARDS
      </span>
    </div>
  );
}
