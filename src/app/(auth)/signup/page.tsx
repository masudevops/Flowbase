"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, undefined);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">Sign up</h1>
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">Create your Flowbase account.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-3 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
        <div className="h-px flex-1 bg-[#DFE1E6] dark:bg-[#2A3547]" />
        or
        <div className="h-px flex-1 bg-[#DFE1E6] dark:bg-[#2A3547]" />
      </div>

      <form action={formAction} className="space-y-4">
        <Input name="fullName" type="text" placeholder="Full name" required autoComplete="name" />
        <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
        <Input
          name="password"
          type="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {state?.error && (
          <p className="text-sm text-[#DE350B] dark:text-[#FF5630]">{state.error}</p>
        )}
        {state?.message && (
          <p className="text-sm text-[#00875A] dark:text-[#36B37E]">{state.message}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#0B5CFF] dark:text-[#4C9AFF]">
          Log in
        </Link>
      </p>
    </div>
  );
}
