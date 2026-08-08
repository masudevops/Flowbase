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
      {children}
    </div>
  );
}
