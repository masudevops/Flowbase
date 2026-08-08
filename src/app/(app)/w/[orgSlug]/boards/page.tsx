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
        <h1 className="text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">Boards</h1>
        <Link
          href={`/w/${orgSlug}/boards/new`}
          className="rounded-md bg-[#0B5CFF] px-3 py-2 text-sm font-medium text-white dark:bg-[#4C9AFF] dark:text-[#0E1624]"
        >
          New board
        </Link>
      </div>

      {boards.length === 0 ? (
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
          No boards yet.{" "}
          <Link href={`/w/${orgSlug}/boards/new`} className="font-medium underline">
            Create your first board
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-[#DFE1E6] rounded-md border border-[#DFE1E6] dark:divide-[#2A3547] dark:border-[#2A3547]">
          {boards.map((board) => (
            <li key={board.id}>
              <Link
                href={`/w/${orgSlug}/boards/${board.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#F4F6FA] dark:hover:bg-[#0E1624]"
              >
                <span className="font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                  {board.name}
                </span>
                {board.templateKey && (
                  <span className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                    {board.templateKey}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
