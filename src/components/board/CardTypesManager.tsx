"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CardType = {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  createdAt: Date;
};

export function CardTypesManager({
  organizationId,
  initialCardTypes,
}: {
  organizationId: string;
  initialCardTypes: CardType[];
}) {
  const utils = trpc.useUtils();
  const { data: cardTypes } = trpc.cardType.list.useQuery(
    { organizationId },
    { initialData: initialCardTypes },
  );

  function refresh() {
    utils.cardType.list.invalidate({ organizationId });
  }

  const createCardType = trpc.cardType.create.useMutation({
    onSuccess: () => {
      setNewName("");
      setNewColor("#6B7280");
      refresh();
    },
  });
  const updateCardType = trpc.cardType.update.useMutation({ onSuccess: refresh });
  const deleteCardType = trpc.cardType.delete.useMutation({ onSuccess: refresh });

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
        Card types
      </h2>
      <p className="mb-3 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Shared across every board in this workspace, not just this one.
      </p>

      <ul className="divide-y divide-[#DFE1E6] rounded-md border border-[#DFE1E6] dark:divide-[#2A3547] dark:border-[#2A3547]">
        {cardTypes?.map((type) => (
          <li key={type.id} className="flex items-center gap-3 px-4 py-3">
            <input
              type="color"
              value={type.color}
              onChange={(e) => updateCardType.mutate({ cardTypeId: type.id, color: e.target.value })}
              className="h-6 w-6 shrink-0 cursor-pointer rounded border border-[#DFE1E6] bg-transparent dark:border-[#2A3547]"
              aria-label={`${type.name} color`}
            />

            {editingId === type.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingName.trim()) {
                    updateCardType.mutate({ cardTypeId: type.id, name: editingName.trim() });
                  }
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
                className="flex-1 text-left text-sm font-medium text-[#172B4D] dark:text-[#E4E7EC]"
                onClick={() => {
                  setEditingId(type.id);
                  setEditingName(type.name);
                }}
              >
                {type.name}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${type.name}"? Cards using it will lose their type.`)) {
                  deleteCardType.mutate({ cardTypeId: type.id });
                }
              }}
              aria-label="Delete card type"
              className="text-[#5E6C84] hover:text-[#DE350B] dark:text-[#8C9BAB] dark:hover:text-[#FF5630]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {cardTypes?.length === 0 && (
          <li className="px-4 py-3 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
            No card types yet.
          </li>
        )}
      </ul>
      {(createCardType.error || updateCardType.error || deleteCardType.error) && (
        <p className="mt-2 text-sm text-[#DE350B] dark:text-[#FF5630]">
          {(createCardType.error ?? updateCardType.error ?? deleteCardType.error)?.message}
        </p>
      )}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          createCardType.mutate({ organizationId, name: newName.trim(), color: newColor });
        }}
      >
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-[#DFE1E6] bg-transparent dark:border-[#2A3547]"
          aria-label="New card type color"
        />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New card type name"
        />
        <Button
          type="submit"
          className="flex w-auto items-center gap-1.5"
          disabled={createCardType.isPending}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>
    </div>
  );
}
