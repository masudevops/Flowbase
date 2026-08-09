import Link from "next/link";
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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#F7F9FC] px-6 dark:bg-[#0E1624]">
      <Link
        href="/"
        className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]"
      >
        Kelbara
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-[#DFE1E6] bg-white p-6 shadow-sm dark:border-[#2A3547] dark:bg-[#161D2E]">
        {children}
      </div>
    </div>
  );
}
