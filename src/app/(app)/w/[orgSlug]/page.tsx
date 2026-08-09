import Link from "next/link";
import { Kanban, CircleDot, Ban, Clock, ArrowRight, LayoutDashboard } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

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
      <PageHeader
        title="Dashboard"
        actions={
          <Link
            href={`/w/${orgSlug}/boards`}
            className="flex items-center gap-1.5 rounded-md bg-[#0B5CFF] px-3 py-2 text-sm font-medium text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
          >
            View boards
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {stats.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center">
          <LayoutDashboard className="h-8 w-8 text-[#5E6C84] dark:text-[#8C9BAB]" />
          <div>
            <p className="text-sm font-medium text-[#172B4D] dark:text-[#E4E7EC]">No boards yet</p>
            <p className="mt-1 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
              Create a board to start tracking work here.
            </p>
          </div>
          <Link
            href={`/w/${orgSlug}/boards/new`}
            className="rounded-md bg-[#0B5CFF] px-3 py-2 text-sm font-medium text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
          >
            Create your first board
          </Link>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((board) => (
            <Link key={board.boardId} href={`/w/${orgSlug}/boards/${board.boardId}`}>
              <Panel className="p-4 transition-colors hover:border-[#0B5CFF]/40 dark:hover:border-[#4C9AFF]/40">
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
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
