import { requireServerCaller } from "@/server/caller";
import { ProfileForm } from "./ProfileForm";

export default async function AccountSettingsPage() {
  const caller = await requireServerCaller();
  const me = await caller.user.me();

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
        Account settings
      </h1>
      <p className="mb-6 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Your name is what teammates see on cards, comments, and the team list.
      </p>
      <ProfileForm email={me.email} initialFullName={me.fullName ?? ""} />
    </div>
  );
}
