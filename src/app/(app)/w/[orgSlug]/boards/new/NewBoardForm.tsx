"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Code2, HardHat, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEMPLATE_OPTIONS = [
  {
    key: undefined,
    label: "Blank",
    description: "No columns or card types — start from scratch.",
    icon: LayoutTemplate,
  },
  {
    key: "IT_DEV" as const,
    label: "IT / Dev",
    description: "Backlog, To Do, In Progress, Blocked, In Review, Done. Task/Bug/Feature types.",
    icon: Code2,
  },
  {
    key: "CONSTRUCTION" as const,
    label: "Construction",
    description:
      "Backlog, Scheduled, In Progress, Blocked/Waiting on Inspection, Punch List, Complete.",
    icon: HardHat,
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
        <label className="mb-1 block text-sm font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
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
        <label className="mb-2 block text-sm font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
          Template
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setTemplateKey(option.key)}
                className={cn(
                  "rounded-md border p-3 text-left text-sm transition-colors",
                  templateKey === option.key
                    ? "border-[#0B5CFF] bg-[#0B5CFF]/5 dark:border-[#4C9AFF] dark:bg-[#4C9AFF]/10"
                    : "border-[#DFE1E6] hover:border-[#0B5CFF]/50 dark:border-[#2A3547] dark:hover:border-[#4C9AFF]/50",
                )}
              >
                <Icon className="h-5 w-5 text-[#0B5CFF] dark:text-[#4C9AFF]" />
                <div className="mt-2 font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                  {option.label}
                </div>
                <div className="mt-1 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {createBoard.error && (
        <p className="text-sm text-[#DE350B] dark:text-[#FF5630]">{createBoard.error.message}</p>
      )}

      <Button
        type="submit"
        disabled={createBoard.isPending || name.trim().length < 2}
        className="flex items-center justify-center gap-1.5"
      >
        <Plus className="h-4 w-4" />
        {createBoard.isPending ? "Creating..." : "Create board"}
      </Button>
    </form>
  );
}
