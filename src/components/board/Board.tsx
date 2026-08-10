"use client";

import { useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { trpc } from "@/trpc/client";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { Column } from "./Column";
import { CardPreview } from "./CardPreview";
import { BoardProgressBar } from "./BoardProgressBar";
import { BoardFilterBar, EMPTY_BOARD_FILTERS, hasActiveFilters, type BoardFilters } from "./BoardFilterBar";
import {
  computeBands,
  groupCardsByBand,
  subscribeToGroupBy,
  getStoredGroupBy,
  getStoredGroupByServerSnapshot,
  setStoredGroupBy,
  type GroupBy,
} from "./swimlanes";
import { Select } from "@/components/ui/select";
import { CardDetailPanel } from "@/components/card-detail/CardDetailPanel";
import type { BoardColumn, CardTypeOption, MemberOption, LabelOption, ContactOption } from "./types";

export function Board({
  boardId,
  initialColumns,
  cardTypes,
  members,
  labels,
  contacts,
}: {
  boardId: string;
  initialColumns: BoardColumn[];
  cardTypes: CardTypeOption[];
  members: MemberOption[];
  labels: LabelOption[];
  contacts: ContactOption[];
}) {
  const searchParams = useSearchParams();
  const [columns, setColumns] = useState(initialColumns);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [highlightedColumnId, setHighlightedColumnId] = useState<string | null>(null);
  const groupBy = useSyncExternalStore(
    subscribeToGroupBy,
    () => getStoredGroupBy(boardId),
    getStoredGroupByServerSnapshot,
  );

  function updateGroupBy(next: GroupBy) {
    setStoredGroupBy(boardId, next);
  }

  // Deep-link support: a notification email (or the search palette) links
  // to /boards/[boardId]?card=[cardId], opening straight to that card. A
  // lazy useState initializer only runs on first mount, which misses
  // client-side navigations that land on this same already-mounted Board
  // instance (e.g. searching from within a board to another card on the
  // same board) — so this reacts to searchParams changing instead, via
  // "adjusting state during render" rather than an effect (a setState
  // called synchronously inside useEffect here would cause an extra,
  // avoidable render pass; this pattern lets React fold it into the same
  // render that noticed the change).
  const [syncedCardParam, setSyncedCardParam] = useState<string | null>(null);
  const cardParam = searchParams.get("card");
  if (cardParam && cardParam !== syncedCardParam) {
    setSyncedCardParam(cardParam);
    setOpenCardId(cardParam);
  }

  const utils = trpc.useUtils();
  const moveCard = trpc.card.move.useMutation();
  const createCard = trpc.card.create.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = activeCardId
    ? columns.flatMap((c) => c.cards).find((c) => c.id === activeCardId)
    : undefined;
  const activeCardColumn = activeCardId
    ? columns.find((c) => c.cards.some((card) => card.id === activeCardId))
    : undefined;

  // Bands are derived from every card on the board (not just one
  // column's) so the same band lands in the same position in every
  // column — see swimlanes.ts.
  const bands = computeBands(
    columns.flatMap((c) => c.cards),
    groupBy,
  );

  // Filtering only narrows what's rendered — `columns` itself (the real
  // source of truth for drag-and-drop and position math) is untouched,
  // so clearing the filters mid-session always restores the exact
  // original board with no risk of corrupted card positions.
  const filteredColumns = hasActiveFilters(filters)
    ? columns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => {
          if (filters.assigneeId && !card.assignees.some((a) => a.user?.id === filters.assigneeId)) return false;
          if (filters.cardTypeId && card.cardType?.id !== filters.cardTypeId) return false;
          if (filters.priority && card.priority !== filters.priority) return false;
          if (filters.blockedOnly && !card.isBlocked) return false;
          return true;
        }),
      }))
    : columns;

  async function refreshBoard() {
    // Refetches both columns and cards (not just cards) so a column
    // added/renamed/reordered/deleted by another session — not just a
    // card change — is reflected too; both tables feed this same view
    // and both are realtime-subscribed below.
    const [board, cards] = await Promise.all([
      utils.board.byId.fetch({ boardId }),
      utils.card.listByBoard.fetch({ boardId }),
    ]);
    setColumns(
      board.columns.map((col) => ({
        ...col,
        cards: cards.filter((c) => c.columnId === col.id),
      })),
    );
  }

  useRealtimeBoard(boardId, refreshBoard);

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceColumn = columns.find((col) => col.cards.some((c) => c.id === activeId));
    const targetColumn =
      columns.find((col) => col.id === overId) ??
      columns.find((col) => col.cards.some((c) => c.id === overId));
    if (!sourceColumn || !targetColumn) return;

    const card = sourceColumn.cards.find((c) => c.id === activeId);
    if (!card) return;

    // Neighbor lookup uses the same band-grouped order the column is
    // actually rendered in (identity when groupBy is "none") — otherwise
    // a drag between two swimlane bands would compute a fractional
    // index against neighbors that aren't the ones visually adjacent to
    // the drop.
    const targetCardsOrdered = groupCardsByBand(targetColumn.cards, bands, groupBy);
    const targetCardsWithoutActive = targetCardsOrdered.filter((c) => c.id !== activeId);
    const overIndex = targetCardsOrdered.findIndex((c) => c.id === overId);
    const insertIndex =
      overIndex === -1 ? targetCardsWithoutActive.length : Math.min(overIndex, targetCardsWithoutActive.length);

    const before = targetCardsWithoutActive[insertIndex - 1]?.position ?? null;
    const after = targetCardsWithoutActive[insertIndex]?.position ?? null;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumn.id && col.id === targetColumn.id) {
          const newCards = [...targetCardsWithoutActive];
          newCards.splice(insertIndex, 0, card);
          return { ...col, cards: newCards };
        }
        if (col.id === sourceColumn.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId) };
        }
        if (col.id === targetColumn.id) {
          const newCards = [...targetCardsWithoutActive];
          newCards.splice(insertIndex, 0, card);
          return { ...col, cards: newCards };
        }
        return col;
      }),
    );

    moveCard.mutate(
      { cardId: activeId, columnId: targetColumn.id, beforePosition: before, afterPosition: after },
      {
        onError: () => setColumns(initialColumns),
        onSuccess: () => refreshBoard(),
      },
    );
  }

  function handleAddCard(columnId: string, title: string) {
    createCard.mutate(
      { boardId, columnId, title },
      { onSuccess: () => refreshBoard() },
    );
  }

  // Cards already visually group by column, and "filter by column" isn't
  // a concept BoardFilters has — so a progress-bar segment click scrolls
  // to and briefly highlights that column instead of filtering to it.
  function handleProgressSegmentClick(columnId: string) {
    document.getElementById(`board-column-${columnId}`)?.scrollIntoView({ behavior: "smooth", inline: "center" });
    setHighlightedColumnId(columnId);
    setTimeout(() => setHighlightedColumnId((current) => (current === columnId ? null : current)), 1200);
  }

  // Named for screen readers using a card's title and column name instead
  // of dnd-kit's default "draggable item" wording — the only part of
  // keyboard drag-and-drop a sighted mouse user never has to think about.
  function findCard(id: string) {
    return columns.flatMap((c) => c.cards).find((c) => c.id === id);
  }
  function findColumnFor(id: string) {
    return columns.find((c) => c.id === id) ?? columns.find((c) => c.cards.some((card) => card.id === id));
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      const card = findCard(String(active.id));
      return card ? `Picked up "${card.title}".` : undefined;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;
      const card = findCard(String(active.id));
      const column = findColumnFor(String(over.id));
      return card && column ? `"${card.title}" is over the ${column.name} column.` : undefined;
    },
    onDragEnd({ active, over }) {
      const card = findCard(String(active.id));
      if (!card) return undefined;
      if (!over) return `Moving "${card.title}" was cancelled.`;
      const column = findColumnFor(String(over.id));
      return column ? `"${card.title}" was moved to the ${column.name} column.` : undefined;
    },
    onDragCancel({ active }) {
      const card = findCard(String(active.id));
      return card ? `Moving "${card.title}" was cancelled.` : undefined;
    },
  };

  return (
    <>
      {/* Desktop/tablet: filters + group-by inline, same as always. */}
      <div className="mb-3 hidden flex-wrap items-start justify-between gap-2 sm:flex">
        <BoardFilterBar filters={filters} onChange={setFilters} members={members} cardTypes={cardTypes} />
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-[#55707D] dark:text-[#8FA8B3]">
          Group by
          <Select
            value={groupBy}
            onChange={(e) => updateGroupBy(e.target.value as GroupBy)}
            className="w-auto"
          >
            <option value="none">None</option>
            <option value="assignee">Assignee</option>
            <option value="priority">Priority</option>
            <option value="type">Type</option>
          </Select>
        </label>
      </div>

      {/* Mobile: filters/group-by collapse behind one button instead of
          eating ~40% of a phone screen's vertical space before any card
          is visible (found during a live UX audit — see Epic 8). */}
      <div className="mb-3 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-[#D3DBD8] px-3 py-2 text-sm font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(hasActiveFilters(filters) || groupBy !== "none") && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D5C8A] dark:bg-[#5FB4E0]" />
          )}
        </button>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 bottom-0 left-0 max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-[#D3DBD8] bg-white p-4 dark:border-[#23414F] dark:bg-[#0F2A3D]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-sm font-medium text-[#1D5C8A] dark:text-[#5FB4E0]"
              >
                Done
              </button>
            </div>
            <div className="flex flex-col items-start gap-3">
              <BoardFilterBar filters={filters} onChange={setFilters} members={members} cardTypes={cardTypes} />
              <label className="flex w-full items-center justify-between gap-1.5 border-t border-[#D3DBD8] pt-3 text-sm text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]">
                Group by
                <Select
                  value={groupBy}
                  onChange={(e) => updateGroupBy(e.target.value as GroupBy)}
                  className="w-auto"
                >
                  <option value="none">None</option>
                  <option value="assignee">Assignee</option>
                  <option value="priority">Priority</option>
                  <option value="type">Type</option>
                </Select>
              </label>
            </div>
          </div>
        </div>
      )}

      <BoardProgressBar columns={filteredColumns} onSegmentClick={handleProgressSegmentClick} />

      <DndContext
        id={`board-${boardId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="blueprint-grid thin-scrollbar flex flex-1 gap-4 overflow-x-auto rounded-lg pb-4">
          {filteredColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              groupBy={groupBy}
              bands={bands}
              onOpenCard={setOpenCardId}
              onAddCard={handleAddCard}
              highlighted={highlightedColumnId === column.id}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <CardPreview
              card={activeCard}
              isDoneColumn={activeCardColumn?.isDoneColumn ?? false}
              onOpen={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {openCardId && (
        <CardDetailPanel
          cardId={openCardId}
          cardTypes={cardTypes}
          members={members}
          labels={labels}
          contacts={contacts}
          onClose={() => setOpenCardId(null)}
          onChanged={refreshBoard}
          onOpenCard={setOpenCardId}
        />
      )}
    </>
  );
}
