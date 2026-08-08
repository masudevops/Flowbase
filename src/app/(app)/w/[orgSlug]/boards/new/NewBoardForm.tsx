"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEMPLATE_OPTIONS = [
  {
    key: undefined,
    label: "Blank",
    description: "No columns or card types — start from scratch.",
  },
  {
    key: "IT_DEV" as const,
    label: "IT / Dev",
    description: "Backlog, To Do, In Progress, Blocked, In Review, Done. Task/Bug/Feature types.",
  },
  {
    key: "CONSTRUCTION" as const,
    label: "Construction",
    description:
      "Backlog, Scheduled, In Progress, Blocked/Waiting on Inspection, Punch List, Complete.",
  },
];

export function NewBoardForm({
  organizationId,
  orgSlug,
}: {
  organizationId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState<"IT_DEV" | "CONSTRUCTION" | undefined>(
    undefined,
  );

  const createBoard = trpc.board.create.useMutation({
    onSuccess: (board) => {
      router.push(`/w/${orgSlug}/boards/${board.id}`);
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createBoard.mutate({ organizationId, name, templateKey });
      }}
      className="space-y-6"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Board name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sprint Board"
          required
          minLength={2}
          maxLength={80}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Template
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setTemplateKey(option.key)}
              className={cn(
                "rounded-md border p-3 text-left text-sm transition-colors",
                templateKey === option.key
                  ? "border-zinc-950 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
              )}
            >
              <div className="font-medium text-zinc-950 dark:text-zinc-50">{option.label}</div>
              <div className="mt-1 text-xs text-zinc-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {createBoard.error && <p className="text-sm text-red-600">{createBoard.error.message}</p>}

      <Button type="submit" disabled={createBoard.isPending || name.trim().length < 2}>
        {createBoard.isPending ? "Creating..." : "Create board"}
      </Button>
    </form>
  );
}
