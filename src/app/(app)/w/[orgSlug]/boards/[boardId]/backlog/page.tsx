import Link from "next/link";
import { notFound } from "next/navigation";
import { requireServerCaller, getOrgBySlugOrNotFound, callOrNotFound } from "@/server/caller";
import { BacklogView } from "@/components/board/BacklogView";

export default async function BacklogPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardId: string }>;
}) {
  const { orgSlug, boardId } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const board = await callOrNotFound(() => caller.board.byId({ boardId }));

  if (board.organizationId !== organization.id) {
    notFound();
  }

  const [cardTypes, members, labels] = await Promise.all([
    caller.cardType.list({ organizationId: organization.id }),
    caller.membership.list({ organizationId: organization.id }),
    caller.label.list({ organizationId: organization.id }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
            {board.name} — Backlog
          </h1>
          <p className="mt-1 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
            All cards on this board, filterable and sortable.
          </p>
        </div>
        <Link
          href={`/w/${orgSlug}/boards/${boardId}`}
          className="rounded-md border border-[#DFE1E6] px-3 py-2 text-sm font-medium text-[#172B4D] dark:border-[#2A3547] dark:text-[#E4E7EC]"
        >
          Back to board
        </Link>
      </div>

      <BacklogView boardId={boardId} cardTypes={cardTypes} members={members} labels={labels} />
    </div>
  );
}
