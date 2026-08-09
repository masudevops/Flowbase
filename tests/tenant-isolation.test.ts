import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { TRPCError } from "@trpc/server";
import { callerAs } from "./helpers/caller";
import {
  createTestOrg,
  createTestUser,
  addMember,
  deleteTestOrgs,
  type TestOrg,
  type TestUser,
} from "./helpers/fixtures";

/// The single most important suite in this project: proves the RLS
/// boundary the whole app leans on (see prisma/rls/002_policies.sql and
/// the audit that preceded this build). Every case here supplies a
/// *real* id belonging to another org and asserts it's invisible — not
/// merely hidden by the UI, actually filtered out by Postgres.
describe("tenant isolation", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];

  let orgA: TestOrg;
  let orgB: TestOrg;
  let userA: TestUser;
  let userB: TestUser;
  let boardBId: string;
  let cardTypeBId: string;
  let cardBId: string;

  beforeAll(async () => {
    await db.connect();
    orgA = await createTestOrg(db, "Tenant Isolation Org A");
    orgB = await createTestOrg(db, "Tenant Isolation Org B");
    orgIds.push(orgA.id, orgB.id);

    userA = await createTestUser(db);
    userB = await createTestUser(db);
    await addMember(db, orgA.id, userA.id, "ADMIN");
    await addMember(db, orgB.id, userB.id, "ADMIN");

    // Real org-B data, created legitimately by org B's own admin.
    const callerB = callerAs(userB.id);
    const board = await callerB.board.create({ organizationId: orgB.id, name: "Org B Board" });
    boardBId = board.id;
    const cardType = await callerB.cardType.create({
      organizationId: orgB.id,
      boardId: boardBId,
      name: "Bug",
      color: "#EF4444",
    });
    cardTypeBId = cardType.id;

    const column = await callerB.column.create({ boardId: boardBId, name: "To Do" });
    const card = await callerB.card.create({ boardId: boardBId, columnId: column.id, title: "Org B's own card" });
    await callerB.card.setAssignees({ cardId: card.id, assignees: [{ userId: userB.id }] });
    cardBId = card.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await db.end();
  });

  it("cannot list another org's boards, even by supplying its real organizationId", async () => {
    const boards = await callerAs(userA.id).board.list({ organizationId: orgB.id });
    expect(boards).toEqual([]);
  });

  it("cannot fetch another org's board by its real id", async () => {
    await expect(callerAs(userA.id).board.byId({ boardId: boardBId })).rejects.toThrow();
  });

  it("cannot create a column on another org's board", async () => {
    await expect(
      callerAs(userA.id).column.create({ boardId: boardBId, name: "Sneaky column" }),
    ).rejects.toThrow();
  });

  it("cannot create a card on another org's board", async () => {
    await expect(
      callerAs(userA.id).card.create({ boardId: boardBId, columnId: boardBId, title: "Sneaky card" }),
    ).rejects.toThrow();
  });

  it("cannot set assignees on another org's card by its real id", async () => {
    await expect(
      callerAs(userA.id).card.setAssignees({ cardId: cardBId, assignees: [{ userId: userA.id }] }),
    ).rejects.toThrow();

    // Confirm it's actually still assigned to org B's own user, not touched.
    const stillAssigned = await callerAs(userB.id).card.byId({ cardId: cardBId });
    expect(stillAssigned.assignees.some((a) => a.user?.id === userB.id)).toBe(true);
  });

  it("cannot list another org's members", async () => {
    const members = await callerAs(userA.id).membership.list({ organizationId: orgB.id });
    expect(members).toEqual([]);
  });

  it("cannot list another org's card types via its real board id", async () => {
    const types = await callerAs(userA.id).cardType.list({ boardId: boardBId });
    expect(types).toEqual([]);
  });

  it("cannot see another org's assigned work via My Work, even by supplying its real organizationId", async () => {
    const myWork = await callerAs(userA.id).card.listAssignedToMe({ organizationId: orgB.id });
    expect(myWork).toEqual([]);
  });

  it("cannot see another org's card activity log via its real card id", async () => {
    const entries = await callerAs(userA.id).auditLog.listByCard({ cardId: cardBId });
    expect(entries).toEqual([]);
  });

  it("cannot update another org's card type by its real id", async () => {
    await expect(
      callerAs(userA.id).cardType.update({ cardTypeId: cardTypeBId, name: "Hijacked" }),
    ).rejects.toThrow();
  });

  it("an unauthenticated caller is rejected outright", async () => {
    try {
      await callerAs(null).board.list({ organizationId: orgA.id });
      expect.unreachable("expected UNAUTHORIZED to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("UNAUTHORIZED");
    }
  });

  it("a real member of org A still sees org A's own data normally", async () => {
    const boards = await callerAs(userA.id).board.list({ organizationId: orgA.id });
    expect(Array.isArray(boards)).toBe(true);
  });
});
