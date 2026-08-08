import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/// Refreshes the Supabase session cookie on every request. Called from
/// the root middleware.ts.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the token if expired. Required for Server Components, which
  // can't set cookies themselves.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate protected routes here, not just in (app)/layout.tsx: Next.js can
  // start rendering a layout and its child page concurrently, so a
  // redirect() thrown from the layout doesn't stop the page's own data
  // fetching (e.g. a protectedProcedure call) from also running and
  // throwing an UNAUTHORIZED error first. Blocking in middleware means
  // the request never reaches the React tree at all when unauthenticated.
  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/callback" ||
    // tRPC procedures do their own auth check and return a JSON-RPC error
    // shape the client understands — redirecting here would hand the
    // client an HTML response instead and break the fetch link.
    pathname.startsWith("/api/");

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
