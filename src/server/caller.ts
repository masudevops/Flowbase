import { redirect, notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers/_app";
import { createContext } from "./context";

/// For calling tRPC procedures directly from Server Components/Actions,
/// so server-rendered pages go through the same protectedProcedure ->
/// RLS-transaction path as client requests, instead of querying Prisma
/// directly and bypassing that bridge.
export async function createServerCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}

/// Same as createServerCaller, but redirects to /login up front instead
/// of letting a protectedProcedure throw UNAUTHORIZED. Middleware already
/// gates unauthenticated requests to protected routes, but Next can start
/// a page's data fetching before that redirect fully takes effect — this
/// is the fallback so pages under (app)/ never surface that as an
/// unhandled error.
export async function requireServerCaller() {
  const ctx = await createContext();
  if (!ctx.userId) {
    redirect("/login");
  }
  return appRouter.createCaller(ctx);
}

/// Shared resolve-org-by-slug-or-404 pattern, used by the workspace
/// layout and every board page under /w/[orgSlug]/... — each still
/// re-resolves per page (no cross-page Server Component caching), but
/// this at least keeps the try/catch NOT_FOUND boilerplate in one place.
export async function getOrgBySlugOrNotFound(
  caller: Awaited<ReturnType<typeof requireServerCaller>>,
  slug: string,
) {
  try {
    const { organization } = await caller.organization.bySlug({ slug });
    return organization;
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }
}
