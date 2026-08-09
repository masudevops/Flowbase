"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/auth";
import { checkRateLimit, RateLimitExceededError } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request-ip";

export type SignupState = { error?: string; message?: string } | undefined;

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  try {
    await checkRateLimit("signup", await getClientIp());
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { error: err.message };
    }
    throw err;
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Something went wrong. Please try again." };
  }

  if (!data.session) {
    // Email confirmation is enabled on this Supabase project — no session
    // yet, the user needs to click the emailed link first.
    return { message: "Check your email to confirm your account, then log in." };
  }

  await ensureUserRecord({ id: data.user.id, email: data.user.email!, fullName });
  redirect("/onboarding");
}
