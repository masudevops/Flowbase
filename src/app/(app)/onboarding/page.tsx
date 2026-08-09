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
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 bg-[#F7F9FC] px-6 dark:bg-[#0E1624]">
      <ThemeToggle className="absolute top-4 right-4 rounded-md p-1.5 text-[#5E6C84] hover:bg-[#172B4D]/5 dark:text-[#8C9BAB] dark:hover:bg-[#E4E7EC]/10" />
      <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]">
        Kelbara
      </span>
      <div className="w-full max-w-sm rounded-lg border border-[#DFE1E6] bg-white p-6 shadow-sm dark:border-[#2A3547] dark:bg-[#161D2E]">
        <CreateOrgForm />
      </div>
    </div>
  );
}
