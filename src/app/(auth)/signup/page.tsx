"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signup } from "./actions";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">Sign up</h1>
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">Create your Kelbara account.</p>
      </div>

      <GoogleAuthButton next={next} />

      <div className="flex items-center gap-3 text-xs text-[#55707D] dark:text-[#8FA8B3]">
        <div className="h-px flex-1 bg-[#D3DBD8] dark:bg-[#23414F]" />
        or
        <div className="h-px flex-1 bg-[#D3DBD8] dark:bg-[#23414F]" />
      </div>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
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
          <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{state.error}</p>
        )}
        {state?.message && (
          <p className="text-sm text-[#0F7A5C] dark:text-[#3FBF95]">{state.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#55707D] dark:text-[#8FA8B3]">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-[#1D5C8A] dark:text-[#5FB4E0]"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
