"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export function DeleteBoardButton({
  boardId,
  boardName,
  orgSlug,
}: {
  boardId: string;
  boardName: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const archiveBoard = trpc.board.archive.useMutation({
    onSuccess: () => router.push(`/w/${orgSlug}/boards`),
    onError: (err) => setError(err.message),
  });

  return (
    <div className="mt-10 rounded-lg border border-[#C1440E]/30 bg-[#C1440E]/5 p-4 dark:border-[#E8703A]/30 dark:bg-[#E8703A]/10">
      <h2 className="text-sm font-semibold text-[#C1440E] dark:text-[#E8703A]">Danger zone</h2>
      <p className="mt-1 mb-3 text-sm text-[#55707D] dark:text-[#8FA8B3]">
        Deleting a board removes it from the boards list for everyone. This can&apos;t be undone from
        the UI.
      </p>
      <Button
        variant="danger"
        disabled={archiveBoard.isPending}
        onClick={() => {
          if (confirm(`Delete "${boardName}"? This can't be undone.`)) {
            archiveBoard.mutate({ boardId });
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
        {archiveBoard.isPending ? "Deleting..." : "Delete board"}
      </Button>
      {error && <p className="mt-2 text-sm text-[#C1440E] dark:text-[#E8703A]">{error}</p>}
    </div>
  );
}
