import { redirect } from "next/navigation";
import { requireServerCaller } from "@/server/caller";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CreateOrgForm } from "./CreateOrgForm";

export default async function OnboardingPage() {
  const caller = await requireServerCaller();
  const orgs = await caller.organization.listMine();

  if (orgs.length > 0) {
    redirect(`/w/${orgs[0].slug}`);
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 bg-[#F5F7F4] px-6 dark:bg-[#0B1F2E]">
      <ThemeToggle className="absolute top-4 right-4 rounded-md p-1.5 text-[#55707D] hover:bg-[#14242E]/5 dark:text-[#8FA8B3] dark:hover:bg-[#E7EEF0]/10" />
      <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
        Kelbara
      </span>
      <div className="w-full max-w-sm rounded-lg border border-[#D3DBD8] bg-white p-6 shadow-sm dark:border-[#23414F] dark:bg-[#0F2A3D]">
        <CreateOrgForm />
      </div>
    </div>
  );
}
