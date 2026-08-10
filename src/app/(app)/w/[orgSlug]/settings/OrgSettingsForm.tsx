"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OrgSettingsForm({
  organizationId,
  initialName,
  isAdmin,
  orgSlug,
}: {
  organizationId: string;
  initialName: string;
  isAdmin: boolean;
  orgSlug: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  const updateOrg = trpc.organization.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      // The org name is read from the layout on every navigation (it's
      // in the sidebar), so a server-component refresh is needed for it
      // to show the new name immediately instead of on the next full load.
      router.refresh();
    },
  });

  if (!isAdmin) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-[#55707D] dark:text-[#8FA8B3]">
          Workspace name
        </label>
        <Input value={initialName} disabled className="opacity-60" />
        <p className="mt-2 text-sm text-[#55707D] dark:text-[#8FA8B3]">
          Only workspace admins can rename this workspace.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        updateOrg.mutate({ organizationId, name: name.trim() });
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-[#55707D] dark:text-[#8FA8B3]">
          Workspace name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name"
          required
          minLength={2}
          maxLength={80}
        />
        <p className="mt-1 text-xs text-[#55707D] dark:text-[#8FA8B3]">
          The URL (/w/{orgSlug}) doesn&apos;t change when you rename the workspace.
        </p>
      </div>
      {updateOrg.error && (
        <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{updateOrg.error.message}</p>
      )}
      {saved && !updateOrg.isPending && (
        <p className="text-sm text-[#0F7A5C] dark:text-[#3FBF95]">Saved.</p>
      )}
      <Button
        type="submit"
        className="w-auto"
        disabled={updateOrg.isPending || name.trim().length < 2 || name.trim() === initialName}
      >
        {updateOrg.isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
