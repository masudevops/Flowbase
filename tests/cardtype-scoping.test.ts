import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { callerAs } from "./helpers/caller";
import { createTestOrg, createTestUser, addMember, deleteTestOrgs, type TestOrg } from "./helpers/fixtures";

/// Proves Build #1's fix: CardType is board-scoped, not org-scoped. Two
/// boards in the same org must not see each other's card types, even
/// though they share an organizationId — this is exactly the leak the
/// product audit flagged (a software board picking up "Punch Item" from
/// an unrelated construction board in the same workspace).
describe("card type board scoping", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];

  let org: TestOrg;
  let adminId: string;
  let boardAId: string;
  let boardBId: string;

  beforeAll(async () => {
    await db.connect();
    org = await createTestOrg(db, "CardType Scoping Org");
    orgIds.push(org.id);

    const admin = await createTestUser(db);
    adminId = admin.id;
    await addMember(db, org.id, adminId, "ADMIN");

    const caller = callerAs(adminId);
    const boardA = await caller.board.create({ organizationId: org.id, name: "Software" });
    const boardB = await caller.board.create({ organizationId: org.id, name: "Construction" });
    boardAId = boardA.id;
    boardBId = boardB.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await db.end();
  });

  it("a type created on board A does not appear on board B", async () => {
    const caller = callerAs(adminId);
    await caller.cardType.create({ organizationId: org.id, boardId: boardAId, name: "Bug", color: "#EF4444" });

    const typesA = await caller.cardType.list({ boardId: boardAId });
    const typesB = await caller.cardType.list({ boardId: boardBId });

    expect(typesA.map((t) => t.name)).toContain("Bug");
    expect(typesB.map((t) => t.name)).not.toContain("Bug");
  });

  it("the same type name is allowed on two different boards in the same org", async () => {
    const caller = callerAs(adminId);
    await caller.cardType.create({ organizationId: org.id, boardId: boardAId, name: "Task", color: "#6B7280" });

    await expect(
      caller.cardType.create({ organizationId: org.id, boardId: boardBId, name: "Task", color: "#6B7280" }),
    ).resolves.toBeDefined();
  });

  it("rejects a duplicate name on the same board", async () => {
    const caller = callerAs(adminId);
    await caller.cardType.create({ organizationId: org.id, boardId: boardAId, name: "Feature", color: "#3B82F6" });

    await expect(
      caller.cardType.create({ organizationId: org.id, boardId: boardAId, name: "Feature", color: "#000000" }),
    ).rejects.toThrow();
  });

  it("deleting a board's type doesn't touch another board's type of the same name", async () => {
    const caller = callerAs(adminId);
    const typesA = await caller.cardType.list({ boardId: boardAId });
    const typesB = await caller.cardType.list({ boardId: boardBId });
    const taskA = typesA.find((t) => t.name === "Task")!;
    const taskB = typesB.find((t) => t.name === "Task")!;

    await caller.cardType.delete({ cardTypeId: taskA.id });

    const typesBAfter = await caller.cardType.list({ boardId: boardBId });
    expect(typesBAfter.map((t) => t.id)).toContain(taskB.id);
  });
});
