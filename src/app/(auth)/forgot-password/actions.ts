"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RateLimitExceededError } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request-ip";

export type ForgotPasswordState = { error?: string; message?: string } | undefined;

const CONFIRMATION_MESSAGE = "If an account exists for that email, a reset link is on its way.";

export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  try {
    await checkRateLimit("forgotPassword", await getClientIp());
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { error: err.message };
    }
    throw err;
  }

  const email = String(formData.get("email") ?? "");

  // redirectTo isn't actually used by the reset-password email link
  // once the Supabase template is set to {{ .TokenHash }} (Epic 12.6) —
  // the destination is hardcoded in that template. Still passed here so
  // the option is populated for any Supabase-side allowlist checks.
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  // Supabase itself doesn't return an error for "no account with this
  // email" (by design, to prevent enumeration) — only for things like a
  // malformed address or its own internal rate limit, both safe to
  // surface as-is.
  if (error) {
    return { error: error.message };
  }

  return { message: CONFIRMATION_MESSAGE };
}
