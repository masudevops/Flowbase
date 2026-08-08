import { notFound } from "next/navigation";
import { requireServerCaller, getOrgBySlugOrNotFound, callOrNotFound } from "@/server/caller";
import { ColumnsManager } from "./ColumnsManager";

export default async function BoardSettingsPage({
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

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
        {board.name} — Columns
      </h1>
      <p className="mb-6 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Rename, reorder, add, or delete columns.
      </p>
      <ColumnsManager boardId={boardId} initialColumns={board.columns} />
    </div>
  );
}
