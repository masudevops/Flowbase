"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { BoardFilterBar, EMPTY_BOARD_FILTERS, hasActiveFilters, type BoardFilters } from "./BoardFilterBar";
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

  // Filtering only narrows what's rendered — `columns` itself (the real
  // source of truth for drag-and-drop and position math) is untouched,
  // so clearing the filters mid-session always restores the exact
  // original board with no risk of corrupted card positions.
  const filteredColumns = hasActiveFilters(filters)
    ? columns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => {
          if (filters.assigneeId && card.assignee?.id !== filters.assigneeId) return false;
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

    const targetCardsWithoutActive = targetColumn.cards.filter((c) => c.id !== activeId);
    const overIndex = targetColumn.cards.findIndex((c) => c.id === overId);
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
      <BoardFilterBar filters={filters} onChange={setFilters} members={members} cardTypes={cardTypes} />

      <DndContext
        id={`board-${boardId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="thin-scrollbar flex flex-1 gap-4 overflow-x-auto pb-4">
          {filteredColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onOpenCard={setOpenCardId}
              onAddCard={handleAddCard}
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
