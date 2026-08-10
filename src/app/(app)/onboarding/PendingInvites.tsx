"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";

type Invite = {
  id: string;
  organizationName: string;
  organizationSlug: string;
  role: "ADMIN" | "MEMBER";
};

export function PendingInvites({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const acceptInvite = trpc.membership.acceptInviteById.useMutation({
    onSuccess: (result) => {
      router.push(`/w/${result.organizationSlug}`);
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="w-full max-w-sm space-y-3">
      <p className="text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
        You&apos;ve been invited to join:
      </p>
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between gap-3 rounded-md border border-[#D3DBD8] bg-white p-3 dark:border-[#23414F] dark:bg-[#0F2A3D]"
        >
          <div>
            <p className="text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
              {invite.organizationName}
            </p>
            <p className="text-xs text-[#55707D] dark:text-[#8FA8B3]">
              As {invite.role === "ADMIN" ? "an admin / project manager" : "a team member"}
            </p>
          </div>
          <Button
            className="shrink-0"
            onClick={() => {
              setJoiningId(invite.id);
              acceptInvite.mutate({ inviteId: invite.id });
            }}
            disabled={acceptInvite.isPending}
          >
            {acceptInvite.isPending && joiningId === invite.id ? "Joining..." : "Join"}
          </Button>
        </div>
      ))}
      {error && <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{error}</p>}
    </div>
  );
}
