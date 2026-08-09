import Link from "next/link";
import { notFound } from "next/navigation";
import { ListTodo, CalendarDays, GanttChartSquare, Settings2, Columns3 } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound, callOrNotFound } from "@/server/caller";
import { Board } from "@/components/board/Board";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

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

  const [cards, cardTypes, members, labels, contacts] = await Promise.all([
    caller.card.listByBoard({ boardId }),
    caller.cardType.list({ boardId }),
    caller.membership.list({ organizationId: organization.id }),
    caller.label.list({ organizationId: organization.id }),
    caller.contact.list({ organizationId: organization.id }),
  ]);

  const columns = board.columns.map((column) => ({
    ...column,
    cards: cards.filter((card) => card.columnId === column.id),
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10">
      <PageHeader
        title={board.name}
        description={board.description}
        actions={
          <>
            <Link
              href={`/w/${orgSlug}/boards/${boardId}/backlog`}
              className="flex items-center gap-1.5 rounded-md border border-[#D3DBD8] px-3 py-2 text-sm font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
            >
              <ListTodo className="h-4 w-4" />
              Backlog
            </Link>
            <Link
              href={`/w/${orgSlug}/boards/${boardId}/calendar`}
              className="flex items-center gap-1.5 rounded-md border border-[#D3DBD8] px-3 py-2 text-sm font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <Link
              href={`/w/${orgSlug}/boards/${boardId}/timeline`}
              className="flex items-center gap-1.5 rounded-md border border-[#D3DBD8] px-3 py-2 text-sm font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
            >
              <GanttChartSquare className="h-4 w-4" />
              Timeline
            </Link>
            <Link
              href={`/w/${orgSlug}/boards/${boardId}/settings`}
              className="flex items-center gap-1.5 rounded-md border border-[#D3DBD8] px-3 py-2 text-sm font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
            >
              <Settings2 className="h-4 w-4" />
              Manage columns
            </Link>
          </>
        }
      />

      {columns.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center">
          <Columns3 className="h-8 w-8 text-[#55707D] dark:text-[#8FA8B3]" />
          <div>
            <p className="text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">No columns yet</p>
            <p className="mt-1 text-sm text-[#55707D] dark:text-[#8FA8B3]">
              Add a column to start moving work through this board.
            </p>
          </div>
          <Link
            href={`/w/${orgSlug}/boards/${boardId}/settings`}
            className="rounded-md bg-[#1D5C8A] px-3 py-2 text-sm font-medium text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]"
          >
            Add your first column
          </Link>
        </Panel>
      ) : (
        <Board
          boardId={boardId}
          initialColumns={columns}
          cardTypes={cardTypes}
          members={members}
          labels={labels}
          contacts={contacts}
        />
      )}
    </div>
  );
}
