/// A `next` redirect target comes from a URL query param, so it's
/// attacker-controllable input — only ever follow it if it's a same-site
/// relative path, never an absolute URL (which could send someone off to
/// an attacker's domain after they just typed their password in).
export function safeRedirectTarget(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
