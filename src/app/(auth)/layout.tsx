import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F7F9FC] px-6 dark:bg-[#0E1624]">
      {children}
    </div>
  );
}
