import { notFound } from "next/navigation";
import { requireServerCaller, callOrNotFound } from "@/server/caller";
import { ColumnsManager } from "./ColumnsManager";
import { CardTypesManager } from "@/components/board/CardTypesManager";
import { AutomationsManager } from "@/components/board/AutomationsManager";
import { DeleteBoardButton } from "@/components/board/DeleteBoardButton";

export default async function BoardSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardId: string }>;
}) {
  const { orgSlug, boardId } = await params;
  const caller = await requireServerCaller();
  const { organization, role } = await callOrNotFound(() => caller.organization.bySlug({ slug: orgSlug }));
  const board = await callOrNotFound(() => caller.board.byId({ boardId }));

  if (board.organizationId !== organization.id) {
    notFound();
  }

  const [cardTypes, automations] = await Promise.all([
    caller.cardType.list({ boardId }),
    caller.automation.list({ boardId }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
        {board.name} — Columns
      </h1>
      <p className="mb-6 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Rename, reorder, add, or delete columns.
      </p>
      <ColumnsManager boardId={boardId} initialColumns={board.columns} />

      <div className="mt-10">
        <CardTypesManager
          organizationId={organization.id}
          boardId={boardId}
          initialCardTypes={cardTypes}
        />
      </div>

      <div className="mt-10">
        <AutomationsManager
          organizationId={organization.id}
          boardId={boardId}
          isAdmin={role === "ADMIN"}
          initialAutomations={automations}
          columns={board.columns.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {role === "ADMIN" && (
        <DeleteBoardButton boardId={boardId} boardName={board.name} orgSlug={orgSlug} />
      )}
    </div>
  );
}
