import Link from "next/link";
import { Plus, Kanban } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        title="Boards"
        actions={
          <Link
            href={`/w/${orgSlug}/boards/new`}
            className="flex items-center gap-1.5 rounded-md bg-[#1D5C8A] px-3 py-2 text-sm font-medium text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]"
          >
            <Plus className="h-4 w-4" />
            New board
          </Link>
        }
      />

      {boards.length === 0 ? (
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
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
              className="flex items-start gap-3 rounded-lg border border-[#D3DBD8] bg-white p-4 transition-shadow hover:shadow-md dark:border-[#23414F] dark:bg-[#0F2A3D]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1D5C8A]/10 text-[#1D5C8A] dark:bg-[#5FB4E0]/15 dark:text-[#5FB4E0]">
                <Kanban className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <span className="block truncate font-medium text-[#14242E] dark:text-[#E7EEF0]">
                  {board.name}
                </span>
                {board.templateKey && (
                  <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">
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
