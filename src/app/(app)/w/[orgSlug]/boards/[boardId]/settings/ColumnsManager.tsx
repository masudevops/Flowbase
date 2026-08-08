"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Column = {
  id: string;
  name: string;
  position: string;
  isDoneColumn: boolean;
  isBlockedColumn: boolean;
};

export function ColumnsManager({
  boardId,
  initialColumns,
}: {
  boardId: string;
  initialColumns: Column[];
}) {
  const utils = trpc.useUtils();
  const [columns, setColumns] = useState(initialColumns);

  async function refresh() {
    const board = await utils.board.byId.fetch({ boardId });
    setColumns(board.columns);
  }

  const createColumn = trpc.column.create.useMutation({ onSuccess: refresh });
  const updateColumn = trpc.column.update.useMutation({ onSuccess: refresh });
  const reorderColumn = trpc.column.reorder.useMutation({ onSuccess: refresh });
  const deleteColumn = trpc.column.delete.useMutation({ onSuccess: refresh });

  const [newColumnName, setNewColumnName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function moveColumn(index: number, direction: -1 | 1) {
    const target = columns[index];
    if (!target) return;

    if (direction === -1) {
      if (index === 0) return;
      reorderColumn.mutate({
        columnId: target.id,
        beforePosition: columns[index - 2]?.position ?? null,
        afterPosition: columns[index - 1].position,
      });
    } else {
      if (index === columns.length - 1) return;
      reorderColumn.mutate({
        columnId: target.id,
        beforePosition: columns[index + 1].position,
        afterPosition: columns[index + 2]?.position ?? null,
      });
    }
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {columns.map((column, i) => (
          <li key={column.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveColumn(i, -1)}
                disabled={i === 0}
                className="text-xs text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-100"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveColumn(i, 1)}
                disabled={i === columns.length - 1}
                className="text-xs text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-100"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            {editingId === column.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateColumn.mutate({ columnId: column.id, name: editingName });
                  setEditingId(null);
                }}
              >
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                  onBlur={() => setEditingId(null)}
                />
              </form>
            ) : (
              <button
                type="button"
                className="flex-1 text-left text-sm font-medium text-zinc-950 dark:text-zinc-50"
                onClick={() => {
                  setEditingId(column.id);
                  setEditingName(column.name);
                }}
              >
                {column.name}
              </button>
            )}

            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={column.isBlockedColumn}
                onChange={(e) =>
                  updateColumn.mutate({ columnId: column.id, isBlockedColumn: e.target.checked })
                }
              />
              Blocked column
            </label>
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={column.isDoneColumn}
                onChange={(e) =>
                  updateColumn.mutate({ columnId: column.id, isDoneColumn: e.target.checked })
                }
              />
              Done column
            </label>

            <button
              type="button"
              onClick={() => deleteColumn.mutate({ columnId: column.id })}
              className="text-xs text-red-600 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {deleteColumn.error && <p className="text-sm text-red-600">{deleteColumn.error.message}</p>}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newColumnName.trim()) return;
          createColumn.mutate({ boardId, name: newColumnName.trim() });
          setNewColumnName("");
        }}
      >
        <Input
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="New column name"
        />
        <Button type="submit" className="w-auto" disabled={createColumn.isPending}>
          Add column
        </Button>
      </form>
    </div>
  );
}
