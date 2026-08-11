"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, undefined);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">
          Reset your password
        </h1>
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
        {state?.error && (
          <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{state.error}</p>
        )}
        {state?.message && (
          <p className="text-sm text-[#0F7A5C] dark:text-[#3FBF95]">{state.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#55707D] dark:text-[#8FA8B3]">
        <Link href="/login" className="font-medium text-[#1D5C8A] dark:text-[#5FB4E0]">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
