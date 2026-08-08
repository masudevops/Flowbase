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
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Sign up</h1>
        <p className="text-sm text-zinc-500">Create your Flowbase account.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form action={formAction} className="space-y-4">
        <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
        <Input
          name="password"
          type="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.message && <p className="text-sm text-green-700 dark:text-green-500">{state.message}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 dark:text-zinc-100">
          Log in
        </Link>
      </p>
    </div>
  );
}
