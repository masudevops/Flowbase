"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = trpc.membership.acceptInvite.useMutation({
    onSuccess: (result) => router.push(`/w/${result.organizationSlug}`),
    onError: (err) => setError(err.message),
  });

  return (
    <div>
      <Button onClick={() => acceptInvite.mutate({ token })} disabled={acceptInvite.isPending}>
        {acceptInvite.isPending ? "Joining..." : "Accept invite"}
      </Button>
      {error && <p className="mt-2 text-sm text-[#DE350B] dark:text-[#FF5630]">{error}</p>}
    </div>
  );
}
