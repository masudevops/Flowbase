import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { NewBoardForm } from "./NewBoardForm";

export default async function NewBoardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const templates = await caller.workflowTemplate.list({ organizationId: organization.id });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">New board</h1>
      <NewBoardForm
        organizationId={organization.id}
        orgSlug={orgSlug}
        initialTemplates={templates}
      />
    </div>
  );
}
