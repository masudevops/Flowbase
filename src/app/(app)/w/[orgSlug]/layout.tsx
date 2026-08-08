import Link from "next/link";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SearchTrigger } from "@/components/search/SearchTrigger";

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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F7F9FC] dark:bg-[#0E1624]">
      <header className="flex items-center justify-between border-b border-[#DFE1E6] px-6 py-3 dark:border-[#2A3547]">
        <div className="flex items-center gap-6">
          <Link href={`/w/${orgSlug}`} className="font-medium text-[#172B4D] dark:text-[#E4E7EC]">
            {organization.name}
          </Link>
          <Link
            href={`/w/${orgSlug}/boards`}
            className="text-sm text-[#5E6C84] hover:text-[#172B4D] dark:text-[#8C9BAB] dark:hover:text-[#E4E7EC]"
          >
            Boards
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <SearchTrigger organizationId={organization.id} orgSlug={orgSlug} />
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
