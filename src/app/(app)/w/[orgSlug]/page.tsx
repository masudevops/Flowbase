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
            className="flex items-center gap-1.5 rounded-md bg-[#1D5C8A] px-3 py-2 text-sm font-medium text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]"
          >
            View boards
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {stats.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center">
          <LayoutDashboard className="h-8 w-8 text-[#55707D] dark:text-[#8FA8B3]" />
          <div>
            <p className="text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">No boards yet</p>
            <p className="mt-1 text-sm text-[#55707D] dark:text-[#8FA8B3]">
              Create a board to start tracking work here.
            </p>
          </div>
          <Link
            href={`/w/${orgSlug}/boards/new`}
            className="rounded-md bg-[#1D5C8A] px-3 py-2 text-sm font-medium text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]"
          >
            Create your first board
          </Link>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((board, i) => (
            <Link key={board.boardId} href={`/w/${orgSlug}/boards/${board.boardId}`}>
              <Panel className="p-4 transition-colors hover:border-[#1D5C8A]/40 dark:hover:border-[#5FB4E0]/40">
                <div className="flex items-center justify-between gap-2 border-b border-[#D3DBD8] pb-2.5 dark:border-[#23414F]">
                  <div className="flex items-center gap-2">
                    <Kanban className="h-4 w-4 text-[#55707D] dark:text-[#8FA8B3]" />
                    <h2 className="font-medium text-[#14242E] dark:text-[#E7EEF0]">
                      {board.boardName}
                    </h2>
                  </div>
                  <span className="font-[family-name:var(--font-plex-mono)] text-[10px] text-[#55707D] dark:text-[#8FA8B3]">
                    SHT.{String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-3 flex gap-5 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CircleDot className="h-3.5 w-3.5 text-[#55707D] dark:text-[#8FA8B3]" />
                    <span className="font-semibold text-[#14242E] dark:text-[#E7EEF0]">
                      {board.openCount}
                    </span>
                    <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">Open</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5 text-[#C1440E] dark:text-[#E8703A]" />
                    <span className="font-semibold text-[#C1440E] dark:text-[#E8703A]">
                      {board.blockedCount}
                    </span>
                    <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">Blocked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#D98324]" />
                    <span className="font-semibold text-[#D98324]">{board.overdueCount}</span>
                    <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">Overdue</span>
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
