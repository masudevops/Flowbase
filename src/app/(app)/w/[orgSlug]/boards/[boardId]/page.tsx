import Link from "next/link";
import { notFound } from "next/navigation";
import { ListTodo, Settings2 } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound, callOrNotFound } from "@/server/caller";
import { Board } from "@/components/board/Board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardId: string }>;
}) {
  const { orgSlug, boardId } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const board = await callOrNotFound(() => caller.board.byId({ boardId }));

  // Board exists and the caller is a member of *an* org that owns it (RLS
  // already guarantees that much) — but not necessarily the org named in
  // this URL, if the caller belongs to more than one. Keep URLs honest.
  if (board.organizationId !== organization.id) {
    notFound();
  }

  const [cards, cardTypes, members, labels] = await Promise.all([
    caller.card.listByBoard({ boardId }),
    caller.cardType.list({ organizationId: organization.id }),
    caller.membership.list({ organizationId: organization.id }),
    caller.label.list({ organizationId: organization.id }),
  ]);

  const columns = board.columns.map((column) => ({
    ...column,
    cards: cards.filter((card) => card.columnId === column.id),
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
            {board.name}
          </h1>
          {board.description && (
            <p className="mt-1 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">{board.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/w/${orgSlug}/boards/${boardId}/backlog`}
            className="flex items-center gap-1.5 rounded-md border border-[#DFE1E6] px-3 py-2 text-sm font-medium text-[#172B4D] dark:border-[#2A3547] dark:text-[#E4E7EC]"
          >
            <ListTodo className="h-4 w-4" />
            Backlog
          </Link>
          <Link
            href={`/w/${orgSlug}/boards/${boardId}/settings`}
            className="flex items-center gap-1.5 rounded-md border border-[#DFE1E6] px-3 py-2 text-sm font-medium text-[#172B4D] dark:border-[#2A3547] dark:text-[#E4E7EC]"
          >
            <Settings2 className="h-4 w-4" />
            Manage columns
          </Link>
        </div>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
          No columns yet.{" "}
          <Link
            href={`/w/${orgSlug}/boards/${boardId}/settings`}
            className="font-medium underline"
          >
            Add one
          </Link>
          .
        </p>
      ) : (
        <Board
          boardId={boardId}
          initialColumns={columns}
          cardTypes={cardTypes}
          members={members}
          labels={labels}
        />
      )}
    </div>
  );
}
