"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

export function SearchPalette({
  organizationId,
  orgSlug,
  onClose,
}: {
  organizationId: string;
  orgSlug: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = trpc.search.query.useQuery(
    { organizationId, query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function goToCard(boardId: string, cardId: string) {
    router.push(`/w/${orgSlug}/boards/${boardId}?card=${cardId}`);
    onClose();
  }

  function goToBoard(boardId: string) {
    router.push(`/w/${orgSlug}/boards/${boardId}`);
    onClose();
  }

  const hasResults = (data?.cards.length ?? 0) > 0 || (data?.boards.length ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[#DFE1E6] bg-white shadow-xl dark:border-[#2A3547] dark:bg-[#161D2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards and boards..."
          className="w-full border-b border-[#DFE1E6] bg-transparent px-4 py-3 text-sm text-[#172B4D] outline-none dark:border-[#2A3547] dark:text-[#E4E7EC]"
        />

        <div className="max-h-96 overflow-y-auto p-2">
          {debouncedQuery.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
              Type to search across this workspace.
            </p>
          )}

          {debouncedQuery.length > 0 && isFetching && !data && (
            <p className="px-2 py-4 text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
              Searching...
            </p>
          )}

          {debouncedQuery.length > 0 && data && !hasResults && (
            <p className="px-2 py-4 text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
              No results for &ldquo;{debouncedQuery}&rdquo;.
            </p>
          )}

          {data && data.boards.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                Boards
              </p>
              {data.boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => goToBoard(board.id)}
                  className="block w-full rounded px-2 py-2 text-left text-sm text-[#172B4D] hover:bg-[#F4F6FA] dark:text-[#E4E7EC] dark:hover:bg-[#0E1624]"
                >
                  {board.name}
                </button>
              ))}
            </div>
          )}

          {data && data.cards.length > 0 && (
            <div>
              <p className="px-2 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                Cards
              </p>
              {data.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => goToCard(card.boardId, card.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-[#F4F6FA] dark:hover:bg-[#0E1624]"
                >
                  {card.cardType && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: card.cardType.color }}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[#172B4D] dark:text-[#E4E7EC]">
                    {card.title}
                  </span>
                  <span className="shrink-0 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                    {card.board.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
