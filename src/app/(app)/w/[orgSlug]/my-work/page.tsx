import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { MyWorkView } from "@/components/board/MyWorkView";

export default async function MyWorkPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const cards = await caller.card.listAssignedToMe({ organizationId: organization.id });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">My Work</h1>
      <p className="mb-6 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Everything assigned to you, across every board in this workspace.
      </p>
      <MyWorkView organizationId={organization.id} orgSlug={orgSlug} initialCards={cards} />
    </div>
  );
}
