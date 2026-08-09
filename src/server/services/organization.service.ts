import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { seedBuiltInTemplates } from "./workflowTemplate.service";

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
///
/// Deliberately avoids Prisma's `.create()` sugar for both inserts: it
/// always issues `INSERT ... RETURNING`, and Postgres additionally
/// enforces the table's SELECT policy against the RETURNING row (since
/// RETURNING is effectively a read) — which fails here, because neither
/// row is visible under the normal membership-based SELECT policy until
/// *both* rows exist. Raw inserts with no RETURNING sidestep that; the
/// final findUniqueOrThrow is a fresh SELECT issued once both rows are
/// already in place, so it passes normally.
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

  const organizationId = randomUUID();

  await db.$executeRaw`
    insert into organizations (id, name, slug, created_at, updated_at)
    values (${organizationId}, ${params.name}, ${slug}, now(), now())
  `;

  await db.$executeRaw`
    insert into memberships (id, organization_id, user_id, role, status, created_at)
    values (${randomUUID()}, ${organizationId}, ${params.userId}, 'ADMIN', 'ACTIVE', now())
  `;

  // Safe to use normal Prisma .create() (RETURNING and all) from here on
  // — the membership row inserted just above is already visible to
  // current_org_ids() within this same transaction, so this org's own
  // SELECT policy is satisfied for every statement that follows.
  await seedBuiltInTemplates(db, organizationId);

  return db.organization.findUniqueOrThrow({ where: { id: organizationId } });
}
