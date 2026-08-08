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
    <div className="mt-10 rounded-lg border border-[#DE350B]/30 bg-[#DE350B]/5 p-4 dark:border-[#FF5630]/30 dark:bg-[#FF5630]/10">
      <h2 className="text-sm font-semibold text-[#DE350B] dark:text-[#FF5630]">Danger zone</h2>
      <p className="mt-1 mb-3 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Deleting a board removes it from the boards list for everyone. This can&apos;t be undone from
        the UI.
      </p>
      <Button
        variant="secondary"
        className="w-auto border-[#DE350B] text-[#DE350B] hover:bg-[#DE350B]/10 dark:border-[#FF5630] dark:text-[#FF5630] dark:hover:bg-[#FF5630]/10"
        disabled={archiveBoard.isPending}
        onClick={() => {
          if (confirm(`Delete "${boardName}"? This can't be undone.`)) {
            archiveBoard.mutate({ boardId });
          }
        }}
      >
        <span className="flex items-center justify-center gap-1.5">
          <Trash2 className="h-4 w-4" />
          {archiveBoard.isPending ? "Deleting..." : "Delete board"}
        </span>
      </Button>
      {error && <p className="mt-2 text-sm text-[#DE350B] dark:text-[#FF5630]">{error}</p>}
    </div>
  );
}
