"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SaveAsTemplateButton({
  organizationId,
  boardId,
  boardName,
}: {
  organizationId: string;
  boardId: string;
  boardName: string;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(`${boardName} template`);

  const saveTemplate = trpc.workflowTemplate.saveFromBoard.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => {
        setOpen(false);
        setSaved(false);
      }, 1800);
    },
  });

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="flex w-auto items-center gap-1.5"
        onClick={() => setOpen(true)}
      >
        <BookmarkPlus className="h-4 w-4" />
        Save as template
      </Button>
    );
  }

  if (saved) {
    return (
      <p className="text-sm text-[#0F7A5C] dark:text-[#3FBF95]">
        Saved — it&apos;ll show up next time you create a board.
      </p>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        saveTemplate.mutate({ organizationId, boardId, name: name.trim() });
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        autoFocus
        className="max-w-xs"
      />
      <Button type="submit" className="w-auto" disabled={saveTemplate.isPending}>
        {saveTemplate.isPending ? "Saving..." : "Save"}
      </Button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-[#55707D] hover:text-[#14242E] dark:text-[#8FA8B3] dark:hover:text-[#E7EEF0]"
      >
        Cancel
      </button>
      {saveTemplate.error && (
        <p className="w-full text-sm text-[#C1440E] dark:text-[#E8703A]">
          {saveTemplate.error.message}
        </p>
      )}
    </form>
  );
}
