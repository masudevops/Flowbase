import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound, callOrNotFound } from "@/server/caller";
import { CalendarView } from "@/components/board/CalendarView";

export default async function CalendarPage({
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

  const [cardTypes, members, labels, contacts] = await Promise.all([
    caller.cardType.list({ boardId }),
    caller.membership.list({ organizationId: organization.id }),
    caller.label.list({ organizationId: organization.id }),
    caller.contact.list({ organizationId: organization.id }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
            {board.name} — Calendar
          </h1>
          <p className="mt-1 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
            Cards plotted by due date.
          </p>
        </div>
        <Link
          href={`/w/${orgSlug}/boards/${boardId}`}
          className="flex items-center gap-1.5 rounded-md border border-[#DFE1E6] px-3 py-2 text-sm font-medium text-[#172B4D] dark:border-[#2A3547] dark:text-[#E4E7EC]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </Link>
      </div>

      <CalendarView
        boardId={boardId}
        cardTypes={cardTypes}
        members={members}
        labels={labels}
        contacts={contacts}
      />
    </div>
  );
}
