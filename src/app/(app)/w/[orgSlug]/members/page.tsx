import { notFound } from "next/navigation";
import { requireServerCaller, callOrNotFound } from "@/server/caller";
import { createContext } from "@/server/context";
import { MembersManager } from "@/components/members/MembersManager";
import { ContactsManager } from "@/components/members/ContactsManager";
import { PageHeader } from "@/components/ui/page-header";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const caller = await requireServerCaller();
  const ctx = await createContext();
  const { organization, role } = await callOrNotFound(() => caller.organization.bySlug({ slug: orgSlug }));

  if (!organization) {
    notFound();
  }

  const [members, invites, contacts] = await Promise.all([
    caller.membership.list({ organizationId: organization.id }),
    role === "ADMIN" ? caller.membership.listInvites({ organizationId: organization.id }) : Promise.resolve([]),
    caller.contact.list({ organizationId: organization.id }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <PageHeader
        title="Team"
        description="Admins can manage roles, invite people, and remove members. Members can view the team."
      />
      <MembersManager
        organizationId={organization.id}
        currentUserId={ctx.userId!}
        currentUserRole={role}
        initialMembers={members}
        initialInvites={invites}
      />

      <div className="mt-10">
        <ContactsManager organizationId={organization.id} initialContacts={contacts} />
      </div>
    </div>
  );
}
