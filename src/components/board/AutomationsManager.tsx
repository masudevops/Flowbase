"use client";

import { useState } from "react";
import { Zap, Trash2, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Automation = {
  id: string;
  organizationId: string;
  boardId: string;
  name: string;
  enabled: boolean;
  action: "NOTIFY_ASSIGNEE";
  triggerColumnId: string;
  createdAt: Date;
  triggerColumn: { id: string; name: string };
};

type ColumnOption = { id: string; name: string };

export function AutomationsManager({
  organizationId,
  boardId,
  isAdmin,
  initialAutomations,
  columns,
}: {
  organizationId: string;
  boardId: string;
  isAdmin: boolean;
  initialAutomations: Automation[];
  columns: ColumnOption[];
}) {
  const utils = trpc.useUtils();
  const { data: automations } = trpc.automation.list.useQuery(
    { boardId },
    { initialData: initialAutomations },
  );

  function refresh() {
    utils.automation.list.invalidate({ boardId });
  }

  const createAutomation = trpc.automation.create.useMutation({
    onSuccess: () => {
      setName("");
      refresh();
    },
  });
  const updateAutomation = trpc.automation.update.useMutation({ onSuccess: refresh });
  const deleteAutomation = trpc.automation.delete.useMutation({ onSuccess: refresh });

  const [name, setName] = useState("");
  const [triggerColumnId, setTriggerColumnId] = useState(columns[0]?.id ?? "");

  return (
    <div>
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
        <Zap className="h-4 w-4" />
        Automations
      </h2>
      <p className="mb-3 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        When a card enters a column, notify its assignee — by email and in the activity feed.
      </p>

      {automations && automations.length > 0 && (
        <div className="divide-y divide-[#DFE1E6] rounded-md border border-[#DFE1E6] dark:divide-[#2A3547] dark:border-[#2A3547]">
          {automations.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                  {a.name}
                </p>
                <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                  When moved to &quot;{a.triggerColumn.name}&quot; → notify assignee
                </p>
              </div>
              {isAdmin && (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                    <Checkbox
                      checked={a.enabled}
                      onChange={(e) =>
                        updateAutomation.mutate({ automationId: a.id, enabled: e.target.checked })
                      }
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete automation "${a.name}"?`)) {
                        deleteAutomation.mutate({ automationId: a.id });
                      }
                    }}
                    aria-label="Delete automation"
                    className="text-[#5E6C84] hover:text-[#DE350B] dark:text-[#8C9BAB] dark:hover:text-[#FF5630]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {(!automations || automations.length === 0) && !isAdmin && (
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">No automations set up yet.</p>
      )}

      {isAdmin && columns.length > 0 && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !triggerColumnId) return;
            createAutomation.mutate({ organizationId, boardId, name: name.trim(), triggerColumnId });
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Automation name"
            className="max-w-[200px]"
          />
          <span className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">When moved to</span>
          <Select
            value={triggerColumnId}
            onChange={(e) => setTriggerColumnId(e.target.value)}
            className="w-auto"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <span className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">notify assignee</span>
          <Button
            type="submit"
            className="flex w-auto items-center gap-1.5"
            disabled={createAutomation.isPending}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      )}
      {createAutomation.error && (
        <p className="mt-2 text-sm text-[#DE350B] dark:text-[#FF5630]">
          {createAutomation.error.message}
        </p>
      )}
    </div>
  );
}
