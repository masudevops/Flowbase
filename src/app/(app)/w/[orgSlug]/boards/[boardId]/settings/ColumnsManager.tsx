"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
      <ul className="divide-y divide-[#D3DBD8] rounded-md border border-[#D3DBD8] dark:divide-[#23414F] dark:border-[#23414F]">
        {columns.map((column, i) => (
          <li key={column.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveColumn(i, -1)}
                  disabled={i === 0}
                  className="text-[#55707D] hover:text-[#14242E] disabled:opacity-30 dark:text-[#8FA8B3] dark:hover:text-[#E7EEF0]"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === columns.length - 1}
                  className="text-[#55707D] hover:text-[#14242E] disabled:opacity-30 dark:text-[#8FA8B3] dark:hover:text-[#E7EEF0]"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
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
                  className="flex-1 text-left text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]"
                  onClick={() => {
                    setEditingId(column.id);
                    setEditingName(column.name);
                  }}
                >
                  {column.name}
                </button>
              )}

              <button
                type="button"
                onClick={() => deleteColumn.mutate({ columnId: column.id })}
                aria-label="Delete column"
                className="shrink-0 text-[#55707D] hover:text-[#C1440E] sm:hidden dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[26px] sm:ml-auto sm:pl-0">
              <label className="flex items-center gap-1.5 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                <Checkbox
                  checked={column.isBlockedColumn}
                  onChange={(e) =>
                    updateColumn.mutate({ columnId: column.id, isBlockedColumn: e.target.checked })
                  }
                />
                Blocked column
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                <Checkbox
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
                aria-label="Delete column"
                className="hidden shrink-0 text-[#55707D] hover:text-[#C1440E] sm:block dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {deleteColumn.error && (
        <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{deleteColumn.error.message}</p>
      )}

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
        <Button
          type="submit"
          className="flex w-auto items-center gap-1.5"
          disabled={createColumn.isPending}
        >
          <Plus className="h-4 w-4" />
          Add column
        </Button>
      </form>
    </div>
  );
}
