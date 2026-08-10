import { notFound } from "next/navigation";
import { requireServerCaller, callOrNotFound } from "@/server/caller";
import { PageHeader } from "@/components/ui/page-header";
import { OrgSettingsForm } from "./OrgSettingsForm";

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const { organization, role } = await callOrNotFound(() => caller.organization.bySlug({ slug: orgSlug }));

  if (!organization) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <PageHeader title="Workspace settings" description="Manage this workspace's name." />
      <OrgSettingsForm
        organizationId={organization.id}
        initialName={organization.name}
        isAdmin={role === "ADMIN"}
        orgSlug={orgSlug}
      />
    </div>
  );
}
