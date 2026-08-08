import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/auth";

/// OAuth (Google) redirect target, and the link target in the
/// signup-confirmation email. Exchanges the auth code for a session, then
/// hands off to onboarding the same way password login does.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
