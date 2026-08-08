import Link from "next/link";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";

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
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Boards</h1>
        <Link
          href={`/w/${orgSlug}/boards/new`}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          New board
        </Link>
      </div>

      {boards.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No boards yet.{" "}
          <Link href={`/w/${orgSlug}/boards/new`} className="font-medium underline">
            Create your first board
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {boards.map((board) => (
            <li key={board.id}>
              <Link
                href={`/w/${orgSlug}/boards/${board.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="font-medium text-zinc-950 dark:text-zinc-50">{board.name}</span>
                {board.templateKey && (
                  <span className="text-xs text-zinc-500">{board.templateKey}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
