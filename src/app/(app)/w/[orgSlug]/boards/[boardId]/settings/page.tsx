import { notFound } from "next/navigation";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { ColumnsManager } from "./ColumnsManager";

export default async function BoardSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardId: string }>;
}) {
  const { orgSlug, boardId } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const board = await caller.board.byId({ boardId });

  if (board.organizationId !== organization.id) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
        {board.name} — Columns
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Rename, reorder, add, or delete columns. Card-type management moves here once cards are
        built.
      </p>
      <ColumnsManager boardId={boardId} initialColumns={board.columns} />
    </div>
  );
}
