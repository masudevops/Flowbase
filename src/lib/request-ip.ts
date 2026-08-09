import { headers } from "next/headers";

/// Vercel sets x-forwarded-for on every request; falls back to a fixed
/// key for local dev (no proxy in front of `next dev`) so rate limiting
/// still exercises its Redis path locally instead of silently no-op'ing.
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local-dev";
}
