import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const organization = await getOrgBySlugOrNotFound(caller, orgSlug);
  const me = await caller.user.me();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F7F9FC] md:flex-row dark:bg-[#0E1624]">
      <Sidebar
        organizationId={organization.id}
        organizationName={organization.name}
        orgSlug={orgSlug}
        currentUser={{ email: me.email, fullName: me.fullName }}
      />
      <main className="flex flex-1 flex-col overflow-x-hidden">{children}</main>
    </div>
  );
}
