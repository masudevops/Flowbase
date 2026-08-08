"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/// Requires the Google provider to be enabled in the Supabase project's
/// Auth settings — the button itself works regardless, Supabase just
/// returns an error at redirect time if the provider isn't configured.
export function GoogleAuthButton() {
  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback` },
    });
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick}>
      Continue with Google
    </Button>
  );
}
