"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/auth";
import { checkRateLimit, RateLimitExceededError } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request-ip";
import { safeRedirectTarget } from "@/lib/safe-redirect";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await checkRateLimit("login", await getClientIp());
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { error: err.message };
    }
    throw err;
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectTarget(formData.get("next")?.toString());

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: error?.message ?? "Invalid email or password." };
  }

  await ensureUserRecord({ id: data.user.id, email: data.user.email! });
  redirect(next ?? "/onboarding");
}
