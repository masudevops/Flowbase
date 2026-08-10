import { randomUUID } from "node:crypto";
import type { Client } from "pg";

/// Fixture helpers for integration tests. These write directly via a
/// superuser (DIRECT_URL) connection, deliberately bypassing RLS and the
/// app layer — the same reasoning prisma/seed.ts uses: setting up test
/// data isn't the thing under test, and there's no logged-in session to
/// satisfy RLS's INSERT checks anyway.

export type TestOrg = { id: string; slug: string };
export type TestUser = { id: string; email: string };

export async function createTestOrg(db: Client, name = "Test Org"): Promise<TestOrg> {
  const id = randomUUID();
  const slug = `test-${randomUUID()}`;
  await db.query(
    `insert into organizations (id, name, slug, created_at, updated_at) values ($1, $2, $3, now(), now())`,
    [id, name, slug],
  );
  return { id, slug };
}

export async function createTestUser(db: Client, email?: string): Promise<TestUser> {
  const id = randomUUID();
  const finalEmail = email ?? `${id}@example.test`;
  await db.query(
    `insert into users (id, email, created_at, updated_at) values ($1, $2, now(), now())`,
    [id, finalEmail],
  );
  return { id, email: finalEmail };
}

export async function addMember(
  db: Client,
  orgId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" = "MEMBER",
): Promise<void> {
  await db.query(
    `insert into memberships (id, organization_id, user_id, role, status, created_at)
     values ($1, $2, $3, $4, 'ACTIVE', now())`,
    [randomUUID(), orgId, userId, role],
  );
}

/// Deletes each org row — cascades to every child table (memberships,
/// boards, columns, cards, card_types, etc.) via the schema's onDelete:
/// Cascade relations. Doesn't touch `users` rows: a user has no FK to
/// the org it's a member of, so it outlives its membership row here —
/// call deleteTestUsers separately for those.
export async function deleteTestOrgs(db: Client, orgIds: string[]): Promise<void> {
  if (orgIds.length === 0) return;
  await db.query(`delete from organizations where id = any($1)`, [orgIds]);
}

/// Deletes test users created via createTestUser. Call this alongside
/// deleteTestOrgs in every suite's afterAll — org cleanup alone leaves
/// these rows behind indefinitely since nothing else references them.
export async function deleteTestUsers(db: Client, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await db.query(`delete from users where id = any($1)`, [userIds]);
}
