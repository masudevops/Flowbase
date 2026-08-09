"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (org) => {
      router.push(`/w/${org.slug}`);
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createOrg.mutate({ name });
      }}
      className="w-full max-w-sm space-y-4"
    >
      <div>
        <h1 className="text-2xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">
          Create your workspace
        </h1>
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
          This is where your boards, members, and settings will live.
        </p>
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Acme Construction"
        required
        minLength={2}
        maxLength={80}
        autoFocus
      />
      {createOrg.error && (
        <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{createOrg.error.message}</p>
      )}
      <Button type="submit" className="w-full" disabled={createOrg.isPending || name.trim().length < 2}>
        {createOrg.isPending ? "Creating..." : "Create workspace"}
      </Button>
    </form>
  );
}
