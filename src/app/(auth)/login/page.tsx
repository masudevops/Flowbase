"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#172B4D] dark:text-[#E4E7EC]">Log in</h1>
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">Welcome back.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-3 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
        <div className="h-px flex-1 bg-[#DFE1E6] dark:bg-[#2A3547]" />
        or
        <div className="h-px flex-1 bg-[#DFE1E6] dark:bg-[#2A3547]" />
      </div>

      <form action={formAction} className="space-y-4">
        <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
        />
        {state?.error && (
          <p className="text-sm text-[#DE350B] dark:text-[#FF5630]">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
        No account?{" "}
        <Link href="/signup" className="font-medium text-[#0B5CFF] dark:text-[#4C9AFF]">
          Sign up
        </Link>
      </p>
    </div>
  );
}
