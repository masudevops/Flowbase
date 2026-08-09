"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#14242E] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E7EEF0]"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign out
    </button>
  );
}
