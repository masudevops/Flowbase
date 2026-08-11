"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type Status = "pending" | "verifying" | "ready" | "invalid";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // A token in the URL waits for an explicit click (below) instead of
  // verifying automatically on load — verifyOtp consumes it on first
  // use, and a plain page-load trigger is exactly what got silently
  // consumed by kelbara.com (a brand-new, no-reputation domain) getting
  // its links pre-scanned before a real click, even by a headless
  // scanner capable of running our JS. A scanner loads and inspects a
  // page; it doesn't simulate a genuine user click. See Epic 12.6.
  const hasRecoveryToken = Boolean(tokenHash) && type === "recovery";
  const [status, setStatus] = useState<Status>(() => (hasRecoveryToken ? "pending" : "verifying"));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasRecoveryToken) return;

    // No token in the URL — only valid if a session already exists
    // (e.g. this page got reloaded after verification already succeeded).
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStatus(user ? "ready" : "invalid");
    });
  }, [hasRecoveryToken]);

  async function handleVerify() {
    if (!tokenHash) return;
    setStatus("verifying");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    setStatus(error ? "invalid" : "ready");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 bg-[#F5F7F4] px-6 dark:bg-[#0B1F2E]">
      <ThemeToggle className="absolute top-4 right-4 rounded-md p-1.5 text-[#55707D] hover:bg-[#14242E]/5 dark:text-[#8FA8B3] dark:hover:bg-[#E7EEF0]/10" />
      <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
        Kelbara
      </span>

      <div className="w-full max-w-sm space-y-6 rounded-lg border border-[#D3DBD8] bg-white p-6 shadow-sm dark:border-[#23414F] dark:bg-[#0F2A3D]">
        {status === "pending" && (
          <>
            <h1 className="text-2xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">
              Reset your password
            </h1>
            <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
              Click below to continue — this confirms it&apos;s really you before we let this
              link touch your account.
            </p>
            <Button className="w-full" onClick={handleVerify}>
              Continue
            </Button>
          </>
        )}

        {status === "verifying" && (
          <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">Verifying your reset link...</p>
        )}

        {status === "invalid" && (
          <>
            <h1 className="text-lg font-semibold text-[#14242E] dark:text-[#E7EEF0]">
              This link is invalid or has expired
            </h1>
            <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
              Reset links can only be used once — request a new one below.
            </p>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#1D5C8A] dark:text-[#5FB4E0]"
            >
              Request a new reset link
            </Link>
          </>
        )}

        {status === "ready" && (
          <>
            <h1 className="text-2xl font-semibold text-[#14242E] dark:text-[#E7EEF0]">
              Choose a new password
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="New password (min. 8 characters)"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {error && <p className="text-sm text-[#C1440E] dark:text-[#E8703A]">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save new password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
