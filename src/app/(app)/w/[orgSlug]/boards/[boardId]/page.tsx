import Link from "next/link";
import { notFound } from "next/navigation";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardId: string }>;
}) {
  const { orgSlug, boardId } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const board = await caller.board.byId({ boardId });

  // Board exists and the caller is a member of *an* org that owns it (RLS
  // already guarantees that much) — but not necessarily the org named in
  // this URL, if the caller belongs to more than one. Keep URLs honest.
  if (board.organizationId !== organization.id) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{board.name}</h1>
          {board.description && (
            <p className="mt-1 text-sm text-zinc-500">{board.description}</p>
          )}
        </div>
        <Link
          href={`/w/${orgSlug}/boards/${boardId}/settings`}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
        >
          Manage columns
        </Link>
      </div>

      {board.columns.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No columns yet.{" "}
          <Link href={`/w/${orgSlug}/boards/${boardId}/settings`} className="font-medium underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="w-64 shrink-0 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {column.name}
                {column.isBlockedColumn && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                    blocked
                  </span>
                )}
                {column.isDoneColumn && (
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                    done
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Cards and drag-and-drop are coming in the next step.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
