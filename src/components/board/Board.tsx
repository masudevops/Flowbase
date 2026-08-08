"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { trpc } from "@/trpc/client";
import { Column } from "./Column";
import { CardPreview } from "./CardPreview";
import { CardDetailPanel } from "@/components/card-detail/CardDetailPanel";
import type { BoardColumn, CardTypeOption, MemberOption, LabelOption } from "./types";

export function Board({
  boardId,
  initialColumns,
  cardTypes,
  members,
  labels,
}: {
  boardId: string;
  initialColumns: BoardColumn[];
  cardTypes: CardTypeOption[];
  members: MemberOption[];
  labels: LabelOption[];
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const moveCard = trpc.card.move.useMutation();
  const createCard = trpc.card.create.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeCard = activeCardId
    ? columns.flatMap((c) => c.cards).find((c) => c.id === activeCardId)
    : undefined;

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
        onSuccess: () => refreshCards(),
      },
    );
  }

  async function refreshCards() {
    const cards = await utils.card.listByBoard.fetch({ boardId });
    setColumns((prev) =>
      prev.map((col) => ({ ...col, cards: cards.filter((c) => c.columnId === col.id) })),
    );
  }

  function handleAddCard(columnId: string, title: string) {
    createCard.mutate(
      { boardId, columnId, title },
      { onSuccess: () => refreshCards() },
    );
  }

  return (
    <>
      <DndContext
        id={`board-${boardId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onOpenCard={setOpenCardId}
              onAddCard={handleAddCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <CardPreview card={activeCard} onOpen={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {openCardId && (
        <CardDetailPanel
          cardId={openCardId}
          cardTypes={cardTypes}
          members={members}
          labels={labels}
          onClose={() => setOpenCardId(null)}
          onChanged={refreshCards}
        />
      )}
    </>
  );
}
