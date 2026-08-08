import Link from "next/link";

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-zinc-500">Dashboard counts (open/blocked/overdue) are coming later.</p>
      <Link
        href={`/w/${orgSlug}/boards`}
        className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
      >
        View boards
      </Link>
    </div>
  );
}
