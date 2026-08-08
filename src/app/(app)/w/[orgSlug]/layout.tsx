import Link from "next/link";
import { requireServerCaller, getOrgBySlugOrNotFound } from "@/server/caller";
import { SignOutButton } from "@/components/auth/SignOutButton";

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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <Link
            href={`/w/${orgSlug}`}
            className="font-medium text-zinc-950 dark:text-zinc-50"
          >
            {organization.name}
          </Link>
          <Link
            href={`/w/${orgSlug}/boards`}
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Boards
          </Link>
        </div>
        <SignOutButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
