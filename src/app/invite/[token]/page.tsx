import Link from "next/link";
import { Kanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServerCaller } from "@/server/caller";
import { Button } from "@/components/ui/button";
import { AcceptInviteButton } from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caller = await createServerCaller();
  const preview = await caller.membership.previewInvite({ token });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#F5F7F4] px-6 dark:bg-[#0B1F2E]">
      <Link
        href="/"
        className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]"
      >
        Kelbara
      </Link>

      <div className="w-full max-w-sm space-y-5 rounded-lg border border-[#D3DBD8] bg-white p-6 text-center dark:border-[#23414F] dark:bg-[#0F2A3D]">
        {!preview ? (
          <>
            <h1 className="text-lg font-semibold text-[#14242E] dark:text-[#E7EEF0]">
              Invite not found
            </h1>
            <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
              This invite link is invalid or has expired. Ask whoever invited you to send a new one.
            </p>
            <Link href="/" className="text-sm font-medium text-[#1D5C8A] dark:text-[#5FB4E0]">
              Back to Kelbara
            </Link>
          </>
        ) : (
          <>
            <Kanban className="mx-auto h-8 w-8 text-[#1D5C8A] dark:text-[#5FB4E0]" />
            <div>
              <h1 className="text-lg font-semibold text-[#14242E] dark:text-[#E7EEF0]">
                Join {preview.organizationName}
              </h1>
              <p className="mt-1 text-sm text-[#55707D] dark:text-[#8FA8B3]">
                You&apos;ve been invited as {preview.role === "ADMIN" ? "an admin / project manager" : "a team member"}.
              </p>
            </div>

            {user ? (
              user.email?.toLowerCase() === preview.email.toLowerCase() ? (
                <AcceptInviteButton token={token} />
              ) : (
                <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">
                  This invite was sent to {preview.email}, but you&apos;re signed in as {user.email}.
                  Log in with the invited email to accept.
                </p>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
                  Log in or sign up with <span className="font-medium">{preview.email}</span>, then
                  open this link again to join.
                </p>
                <div className="flex gap-2">
                  <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`} className="flex-1">
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
