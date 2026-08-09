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
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
        <Zap className="h-4 w-4" />
        Automations
      </h2>
      <p className="mb-3 text-sm text-[#55707D] dark:text-[#8FA8B3]">
        When a card enters a column, notify its assignee — by email and in the activity feed.
      </p>

      {automations && automations.length > 0 && (
        <div className="divide-y divide-[#D3DBD8] rounded-md border border-[#D3DBD8] dark:divide-[#23414F] dark:border-[#23414F]">
          {automations.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
                  {a.name}
                </p>
                <p className="text-xs text-[#55707D] dark:text-[#8FA8B3]">
                  When moved to &quot;{a.triggerColumn.name}&quot; → notify assignee
                </p>
              </div>
              {isAdmin && (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-[#55707D] dark:text-[#8FA8B3]">
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
                    className="text-[#55707D] hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
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
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">No automations set up yet.</p>
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
          <span className="text-sm text-[#55707D] dark:text-[#8FA8B3]">When moved to</span>
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
          <span className="text-sm text-[#55707D] dark:text-[#8FA8B3]">notify assignee</span>
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
        <p className="mt-2 text-sm text-[#C1440E] dark:text-[#E8703A]">
          {createAutomation.error.message}
        </p>
      )}
    </div>
  );
}
