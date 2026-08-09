import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireServerCaller, getOrgBySlugOrNotFound, callOrNotFound } from "@/server/caller";
import { TimelineView } from "@/components/board/TimelineView";
import { PageHeader } from "@/components/ui/page-header";

export default async function TimelinePage({
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
      <PageHeader
        title={`${board.name} — Timeline`}
        description="Work plotted across a date axis, from start to due date."
        actions={
          <Link
            href={`/w/${orgSlug}/boards/${boardId}`}
            className="flex items-center gap-1.5 rounded-md border border-[#D3DBD8] px-3 py-2 text-sm font-medium text-[#14242E] dark:border-[#23414F] dark:text-[#E7EEF0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to board
          </Link>
        }
      />

      <TimelineView
        boardId={boardId}
        cardTypes={cardTypes}
        members={members}
        labels={labels}
        contacts={contacts}
      />
    </div>
  );
}
