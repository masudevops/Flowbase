import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/auth";
import { safeRedirectTarget } from "@/lib/safe-redirect";

/// OAuth (Google) redirect target, and the link target in the
/// signup-confirmation email. Exchanges the auth code for a session, then
/// hands off to onboarding the same way password login does.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Carried through from GoogleAuthButton's redirectTo or signup's
  // emailRedirectTo (both append it as a query param) — e.g. an invite
  // link, so accepting an invite survives a Google sign-in or an email
  // confirmation click instead of always landing on /onboarding.
  const next = safeRedirectTarget(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Google (and the password-signup path, which sets the same key)
      // populates full_name in user_metadata — no separate name prompt
      // needed for OAuth sign-ins.
      const fullName =
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        null;
      await ensureUserRecord({ id: data.user.id, email: data.user.email!, fullName });
      return NextResponse.redirect(`${origin}${next ?? "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
