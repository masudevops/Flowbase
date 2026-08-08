import type { Prisma } from "@prisma/client";

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "workspace";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/// Creates a new organization and its creator's ADMIN membership in one
/// transaction. `db` must be an RLS-scoped transaction client (see
/// server/rls.ts) — org creation is allowed by the `insert_org` /
/// `insert_own_membership` RLS policies regardless of the caller's
/// existing org memberships (see prisma/rls/002_policies.sql for why).
export async function createOrganization(
  db: Prisma.TransactionClient,
  params: { name: string; userId: string },
) {
  const baseSlug = slugify(params.name);
  let slug = baseSlug;

  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.organization.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${randomSuffix()}`;
  }

  return db.organization.create({
    data: {
      name: params.name,
      slug,
      memberships: {
        create: { userId: params.userId, role: "ADMIN", status: "ACTIVE" },
      },
    },
  });
}
