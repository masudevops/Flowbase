"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">Log in</h1>
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">Welcome back.</p>
      </div>

      <GoogleAuthButton next={next} />

      <div className="flex items-center gap-3 text-xs text-[#55707D] dark:text-[#8FA8B3]">
        <div className="h-px flex-1 bg-[#D3DBD8] dark:bg-[#23414F]" />
        or
        <div className="h-px flex-1 bg-[#D3DBD8] dark:bg-[#23414F]" />
      </div>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
        />
        <p className="text-right text-sm">
          <Link href="/forgot-password" className="font-medium text-[#1D5C8A] dark:text-[#5FB4E0]">
            Forgot password?
          </Link>
        </p>
        {state?.error && (
          <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#55707D] dark:text-[#8FA8B3]">
        No account?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-[#1D5C8A] dark:text-[#5FB4E0]"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
