"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  email,
  initialFullName,
}: {
  email: string;
  initialFullName: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [saved, setSaved] = useState(false);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => setSaved(true),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        updateProfile.mutate({ fullName });
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
          Email
        </label>
        <Input value={email} disabled className="opacity-60" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
          Full name
        </label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          required
          maxLength={100}
        />
      </div>
      {updateProfile.error && (
        <p className="text-sm text-[#DE350B] dark:text-[#FF5630]">{updateProfile.error.message}</p>
      )}
      {saved && !updateProfile.isPending && (
        <p className="text-sm text-[#00875A] dark:text-[#36B37E]">Saved.</p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={updateProfile.isPending || fullName.trim().length === 0}
      >
        {updateProfile.isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
