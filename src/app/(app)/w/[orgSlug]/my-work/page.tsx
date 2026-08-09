import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { MyWorkView } from "@/components/board/MyWorkView";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader title="My Work" description="Everything assigned to you, across every board in this workspace." />
      <MyWorkView organizationId={organization.id} orgSlug={orgSlug} initialCards={cards} />
    </div>
  );
}
