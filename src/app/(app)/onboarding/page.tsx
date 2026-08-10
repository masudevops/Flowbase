import { redirect } from "next/navigation";
import { requireServerCaller } from "@/server/caller";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CreateOrgForm } from "./CreateOrgForm";
import { PendingInvites } from "./PendingInvites";

export default async function OnboardingPage() {
  const caller = await requireServerCaller();
  const orgs = await caller.organization.listMine();

  if (orgs.length > 0) {
    redirect(`/w/${orgs[0].slug}`);
  }

  // Fallback for when an invite token didn't survive the signup/login
  // redirect chain (e.g. the user navigated away from the emailed link
  // and came back cold) — without this, a brand-new invited user only
  // ever sees "create workspace" here, with no way back to the org they
  // were actually invited to short of re-finding the original email.
  const invites = await caller.membership.listMyInvites();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 bg-[#F5F7F4] px-6 dark:bg-[#0B1F2E]">
      <ThemeToggle className="absolute top-4 right-4 rounded-md p-1.5 text-[#55707D] hover:bg-[#14242E]/5 dark:text-[#8FA8B3] dark:hover:bg-[#E7EEF0]/10" />
      <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
        Kelbara
      </span>

      {invites.length > 0 && <PendingInvites invites={invites} />}

      <div className="w-full max-w-sm rounded-lg border border-[#D3DBD8] bg-white p-6 shadow-sm dark:border-[#23414F] dark:bg-[#0F2A3D]">
        {invites.length > 0 ? (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-[#55707D] dark:text-[#8FA8B3]">
              Or create a new workspace instead
            </summary>
            <div className="mt-4">
              <CreateOrgForm />
            </div>
          </details>
        ) : (
          <CreateOrgForm />
        )}
      </div>
    </div>
  );
}
