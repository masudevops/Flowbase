"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Code2, HardHat, ClipboardList, Sparkles, Plus, X } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkflowTemplate = {
  id: string;
  organizationId: string;
  key: string | null;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  createdById: string | null;
  createdAt: Date;
  columns: {
    id: string;
    organizationId: string;
    templateId: string;
    name: string;
    position: number;
    isDoneColumn: boolean;
    isBlockedColumn: boolean;
  }[];
  cardTypes: {
    id: string;
    organizationId: string;
    templateId: string;
    name: string;
    color: string;
    isDefault: boolean;
    position: number;
  }[];
};

const BUILT_IN_ICONS: Record<string, typeof Code2> = {
  IT_DEV: Code2,
  CONSTRUCTION: HardHat,
  GENERAL_PM: ClipboardList,
};

function summarize(template: WorkflowTemplate): string {
  if (template.description) return template.description;
  const columnNames = template.columns.map((c) => c.name).join(", ");
  return columnNames || "No columns yet.";
}

export function NewBoardForm({
  organizationId,
  orgSlug,
  initialTemplates,
}: {
  organizationId: string;
  orgSlug: string;
  initialTemplates: WorkflowTemplate[];
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: templates } = trpc.workflowTemplate.list.useQuery(
    { organizationId },
    { initialData: initialTemplates },
  );

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  const createBoard = trpc.board.create.useMutation({
    onSuccess: (board) => {
      router.push(`/w/${orgSlug}/boards/${board.id}`);
      router.refresh();
    },
  });
  const deleteTemplate = trpc.workflowTemplate.delete.useMutation({
    onSuccess: () => {
      utils.workflowTemplate.list.invalidate({ organizationId });
      setTemplateId((current) => (current && !templates.some((t) => t.id === current) ? undefined : current));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createBoard.mutate({ organizationId, name, templateId });
      }}
      className="space-y-6"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-[#55707D] dark:text-[#8FA8B3]">
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
        <label className="mb-2 block text-sm font-medium text-[#55707D] dark:text-[#8FA8B3]">
          Template
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTemplateId(undefined)}
            className={cn(
              "rounded-md border p-3 text-left text-sm transition-colors",
              templateId === undefined
                ? "border-[#1D5C8A] bg-[#1D5C8A]/5 dark:border-[#5FB4E0] dark:bg-[#5FB4E0]/10"
                : "border-[#D3DBD8] hover:border-[#1D5C8A]/50 dark:border-[#23414F] dark:hover:border-[#5FB4E0]/50",
            )}
          >
            <LayoutTemplate className="h-5 w-5 text-[#1D5C8A] dark:text-[#5FB4E0]" />
            <div className="mt-2 font-medium text-[#14242E] dark:text-[#E7EEF0]">Blank</div>
            <div className="mt-1 text-xs text-[#55707D] dark:text-[#8FA8B3]">
              No columns or card types — start from scratch.
            </div>
          </button>

          {templates.map((template) => {
            const Icon = (template.key && BUILT_IN_ICONS[template.key]) || Sparkles;
            return (
              <div
                key={template.id}
                className={cn(
                  "group relative rounded-md border p-3 text-left text-sm transition-colors",
                  templateId === template.id
                    ? "border-[#1D5C8A] bg-[#1D5C8A]/5 dark:border-[#5FB4E0] dark:bg-[#5FB4E0]/10"
                    : "border-[#D3DBD8] hover:border-[#1D5C8A]/50 dark:border-[#23414F] dark:hover:border-[#5FB4E0]/50",
                )}
              >
                <button type="button" onClick={() => setTemplateId(template.id)} className="w-full text-left">
                  <Icon className="h-5 w-5 text-[#1D5C8A] dark:text-[#5FB4E0]" />
                  <div className="mt-2 font-medium text-[#14242E] dark:text-[#E7EEF0]">
                    {template.name}
                  </div>
                  <div className="mt-1 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                    {summarize(template)}
                  </div>
                </button>
                {!template.isBuiltIn && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete the "${template.name}" template? This won't affect boards already created from it.`)) {
                        deleteTemplate.mutate({ templateId: template.id });
                      }
                    }}
                    aria-label={`Delete ${template.name} template`}
                    className="absolute top-2 right-2 hidden rounded p-1 text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#C1440E] group-hover:block dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E8703A]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {createBoard.error && (
        <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{createBoard.error.message}</p>
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
