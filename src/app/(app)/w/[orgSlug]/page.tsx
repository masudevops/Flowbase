import Link from "next/link";
import { Kanban, CircleDot, Ban, Clock, ArrowRight } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const stats = await caller.dashboard.stats({ organizationId: organization.id });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">Dashboard</h1>
        <Link
          href={`/w/${orgSlug}/boards`}
          className="flex items-center gap-1.5 rounded-md bg-[#0B5CFF] px-3 py-2 text-sm font-medium text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
        >
          View boards
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
          No boards yet.{" "}
          <Link href={`/w/${orgSlug}/boards/new`} className="font-medium underline">
            Create your first board
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((board) => (
            <Link
              key={board.boardId}
              href={`/w/${orgSlug}/boards/${board.boardId}`}
              className="rounded-lg border border-[#DFE1E6] bg-white p-4 transition-shadow hover:shadow-md dark:border-[#2A3547] dark:bg-[#161D2E]"
            >
              <div className="flex items-center gap-2">
                <Kanban className="h-4 w-4 text-[#5E6C84] dark:text-[#8C9BAB]" />
                <h2 className="font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                  {board.boardName}
                </h2>
              </div>
              <div className="mt-3 flex gap-5 text-sm">
                <div className="flex items-center gap-1.5">
                  <CircleDot className="h-3.5 w-3.5 text-[#5E6C84] dark:text-[#8C9BAB]" />
                  <span className="font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
                    {board.openCount}
                  </span>
                  <span className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ban className="h-3.5 w-3.5 text-[#DE350B] dark:text-[#FF5630]" />
                  <span className="font-semibold text-[#DE350B] dark:text-[#FF5630]">
                    {board.blockedCount}
                  </span>
                  <span className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">Blocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#FF991F]" />
                  <span className="font-semibold text-[#FF991F]">{board.overdueCount}</span>
                  <span className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">Overdue</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
