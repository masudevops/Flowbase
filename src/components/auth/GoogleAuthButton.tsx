"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/// Requires the Google provider to be enabled in the Supabase project's
/// Auth settings — the button itself works regardless, Supabase just
/// returns an error at redirect time if the provider isn't configured.
export function GoogleAuthButton({ next }: { next?: string | null }) {
  async function handleClick() {
    const supabase = createClient();
    const redirectTo = next
      ? `${window.location.origin}/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <Button type="button" variant="secondary" className="w-full" onClick={handleClick}>
      Continue with Google
    </Button>
  );
}
