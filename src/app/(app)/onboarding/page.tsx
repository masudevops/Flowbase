import { redirect } from "next/navigation";
import { requireServerCaller } from "@/server/caller";
import { CreateOrgForm } from "./CreateOrgForm";

export default async function OnboardingPage() {
  const caller = await requireServerCaller();
  const orgs = await caller.organization.listMine();

  if (orgs.length > 0) {
    redirect(`/w/${orgs[0].slug}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#F7F9FC] px-6 dark:bg-[#0E1624]">
      <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]">
        Flowbase
      </span>
      <CreateOrgForm />
    </div>
  );
}
