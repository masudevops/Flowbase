import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireServerCaller } from "@/server/caller";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "./ProfileForm";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const caller = await requireServerCaller();
  const me = await caller.user.me();
  const { from } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <Link
        href={from ? `/w/${from}` : "/"}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[#5E6C84] hover:text-[#172B4D] dark:text-[#8C9BAB] dark:hover:text-[#E4E7EC]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workspace
      </Link>
      <PageHeader
        title="Account settings"
        description="Your name is what teammates see on cards, comments, and the team list."
      />
      <ProfileForm email={me.email} initialFullName={me.fullName ?? ""} />
    </div>
  );
}
