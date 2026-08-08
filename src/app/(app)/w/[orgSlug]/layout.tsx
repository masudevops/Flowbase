import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { requireServerCaller } from "@/server/caller";
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

  let organization;
  try {
    ({ organization } = await caller.organization.bySlug({ slug: orgSlug }));
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{organization.name}</span>
        <SignOutButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
