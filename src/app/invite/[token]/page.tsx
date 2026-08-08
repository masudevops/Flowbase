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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#F7F9FC] px-6 dark:bg-[#0E1624]">
      <Link
        href="/"
        className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]"
      >
        Kelbara
      </Link>

      <div className="w-full max-w-sm space-y-5 rounded-lg border border-[#DFE1E6] bg-white p-6 text-center dark:border-[#2A3547] dark:bg-[#161D2E]">
        {!preview ? (
          <>
            <h1 className="text-lg font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
              Invite not found
            </h1>
            <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
              This invite link is invalid or has expired. Ask whoever invited you to send a new one.
            </p>
            <Link href="/" className="text-sm font-medium text-[#0B5CFF] dark:text-[#4C9AFF]">
              Back to Kelbara
            </Link>
          </>
        ) : (
          <>
            <Kanban className="mx-auto h-8 w-8 text-[#0B5CFF] dark:text-[#4C9AFF]" />
            <div>
              <h1 className="text-lg font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
                Join {preview.organizationName}
              </h1>
              <p className="mt-1 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
                You&apos;ve been invited as {preview.role === "ADMIN" ? "an admin / project manager" : "a team member"}.
              </p>
            </div>

            {user ? (
              user.email?.toLowerCase() === preview.email.toLowerCase() ? (
                <AcceptInviteButton token={token} />
              ) : (
                <p className="text-sm text-[#DE350B] dark:text-[#FF5630]">
                  This invite was sent to {preview.email}, but you&apos;re signed in as {user.email}.
                  Log in with the invited email to accept.
                </p>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
                  Log in or sign up with <span className="font-medium">{preview.email}</span>, then
                  open this link again to join.
                </p>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="secondary">Log in</Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button>Sign up</Button>
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
