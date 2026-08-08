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
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Create your workspace
        </h1>
        <p className="text-sm text-zinc-500">
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
      {createOrg.error && <p className="text-sm text-red-600">{createOrg.error.message}</p>}
      <Button type="submit" disabled={createOrg.isPending || name.trim().length < 2}>
        {createOrg.isPending ? "Creating..." : "Create workspace"}
      </Button>
    </form>
  );
}
