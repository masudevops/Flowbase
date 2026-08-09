import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { callerAs } from "./helpers/caller";
import { createTestOrg, createTestUser, addMember, deleteTestOrgs, type TestOrg } from "./helpers/fixtures";

/// Comment edit/delete authorization (Build #4): author-only edit,
/// author-or-admin delete — see the comment in
/// src/server/routers/comment.ts for why those two are scoped
/// differently.
describe("comment lifecycle", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];

  let org: TestOrg;
  let adminId: string;
  let authorId: string;
  let otherMemberId: string;
  let cardId: string;

  beforeAll(async () => {
    await db.connect();
    org = await createTestOrg(db, "Comment Lifecycle Org");
    orgIds.push(org.id);

    const admin = await createTestUser(db);
    const author = await createTestUser(db);
    const other = await createTestUser(db);
    adminId = admin.id;
    authorId = author.id;
    otherMemberId = other.id;
    await addMember(db, org.id, adminId, "ADMIN");
    await addMember(db, org.id, authorId, "MEMBER");
    await addMember(db, org.id, otherMemberId, "MEMBER");

    const caller = callerAs(adminId);
    const board = await caller.board.create({ organizationId: org.id, name: "Board" });
    const column = await caller.column.create({ boardId: board.id, name: "To Do" });
    const card = await caller.card.create({ boardId: board.id, columnId: column.id, title: "Card" });
    cardId = card.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await db.end();
  });

  it("rate-limits comment creation past the configured budget (Epic 8.2)", async () => {
    // A dedicated user so this test's own rate-limit key (keyed by
    // userId in src/lib/ratelimit.ts) starts fresh regardless of what
    // other tests/runs have done — the 30/10min budget is per-user.
    const spammer = await createTestUser(db);
    await addMember(db, org.id, spammer.id, "MEMBER");
    const caller = callerAs(spammer.id);

    for (let i = 0; i < 30; i++) {
      await caller.comment.create({ cardId, body: `Comment ${i}` });
    }

    await expect(caller.comment.create({ cardId, body: "One too many" })).rejects.toThrow(/too many requests/i);
  }, 30_000);

  it("the author can edit their own comment, and it's marked edited", async () => {
    const comment = await callerAs(authorId).comment.create({ cardId, body: "Original text" });
    const updated = await callerAs(authorId).comment.update({ commentId: comment.id, body: "Fixed text" });
    expect(updated.body).toBe("Fixed text");
    expect(updated.editedAt).not.toBeNull();
  });

  it("a different member cannot edit someone else's comment", async () => {
    const comment = await callerAs(authorId).comment.create({ cardId, body: "Another comment" });
    await expect(
      callerAs(otherMemberId).comment.update({ commentId: comment.id, body: "Hijacked" }),
    ).rejects.toThrow();
  });

  it("an admin cannot edit someone else's comment either", async () => {
    const comment = await callerAs(authorId).comment.create({ cardId, body: "Yet another" });
    await expect(
      callerAs(adminId).comment.update({ commentId: comment.id, body: "Admin-edited" }),
    ).rejects.toThrow();
  });

  it("a different, non-admin member cannot delete someone else's comment", async () => {
    const comment = await callerAs(authorId).comment.create({ cardId, body: "Delete me not" });
    await expect(
      callerAs(otherMemberId).comment.delete({ commentId: comment.id }),
    ).rejects.toThrow();
  });

  it("the author can delete their own comment", async () => {
    const comment = await callerAs(authorId).comment.create({ cardId, body: "Delete me" });
    await expect(callerAs(authorId).comment.delete({ commentId: comment.id })).resolves.toBeDefined();
  });

  it("an admin can delete someone else's comment (moderation)", async () => {
    const comment = await callerAs(authorId).comment.create({ cardId, body: "Moderate me" });
    await expect(callerAs(adminId).comment.delete({ commentId: comment.id })).resolves.toBeDefined();
  });
});
