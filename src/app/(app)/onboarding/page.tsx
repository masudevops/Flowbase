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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <CreateOrgForm />
    </div>
  );
}
