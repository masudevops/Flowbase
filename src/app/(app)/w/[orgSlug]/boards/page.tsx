import Link from "next/link";
import { Plus, Kanban } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";

const TEMPLATE_LABELS: Record<string, string> = {
  IT_DEV: "IT / Dev",
  CONSTRUCTION: "Construction",
};

export default async function BoardsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const boards = await caller.board.list({ organizationId: organization.id });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">Boards</h1>
        <Link
          href={`/w/${orgSlug}/boards/new`}
          className="flex items-center gap-1.5 rounded-md bg-[#0B5CFF] px-3 py-2 text-sm font-medium text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
        >
          <Plus className="h-4 w-4" />
          New board
        </Link>
      </div>

      {boards.length === 0 ? (
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
          No boards yet.{" "}
          <Link href={`/w/${orgSlug}/boards/new`} className="font-medium underline">
            Create your first board
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/w/${orgSlug}/boards/${board.id}`}
              className="flex items-start gap-3 rounded-lg border border-[#DFE1E6] bg-white p-4 transition-shadow hover:shadow-md dark:border-[#2A3547] dark:bg-[#161D2E]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#0B5CFF]/10 text-[#0B5CFF] dark:bg-[#4C9AFF]/15 dark:text-[#4C9AFF]">
                <Kanban className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <span className="block truncate font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                  {board.name}
                </span>
                {board.templateKey && (
                  <span className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                    {TEMPLATE_LABELS[board.templateKey] ?? board.templateKey}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
