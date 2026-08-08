import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { callerAs } from "./helpers/caller";
import { createTestOrg, createTestUser, addMember, deleteTestOrgs, type TestOrg } from "./helpers/fixtures";

/// Sanity coverage for the core card lifecycle, plus the
/// assignee/assigneeContact mutual-exclusivity rule
/// (src/server/services/card.service.ts) — not primarily a security
/// suite like the other three, but the everyday path everything else
/// depends on staying correct.
describe("card mutations", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];

  let org: TestOrg;
  let adminId: string;
  let memberId: string;
  let boardId: string;
  let columnId: string;
  let doneColumnId: string;

  beforeAll(async () => {
    await db.connect();
    org = await createTestOrg(db, "Card Mutations Org");
    orgIds.push(org.id);

    const admin = await createTestUser(db);
    const member = await createTestUser(db);
    adminId = admin.id;
    memberId = member.id;
    await addMember(db, org.id, adminId, "ADMIN");
    await addMember(db, org.id, memberId, "MEMBER");

    const caller = callerAs(adminId);
    const board = await caller.board.create({ organizationId: org.id, name: "Board" });
    boardId = board.id;
    const column = await caller.column.create({ boardId, name: "To Do" });
    columnId = column.id;
    const doneColumn = await caller.column.create({ boardId, name: "Done" });
    await caller.column.update({ columnId: doneColumn.id, isDoneColumn: true });
    doneColumnId = doneColumn.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await db.end();
  });

  it("creates a card and moves it between columns", async () => {
    const caller = callerAs(adminId);
    const card = await caller.card.create({ boardId, columnId, title: "Ship the thing" });
    expect(card.columnId).toBe(columnId);

    const moved = await caller.card.move({
      cardId: card.id,
      columnId: doneColumnId,
      beforePosition: null,
      afterPosition: null,
    });
    expect(moved.columnId).toBe(doneColumnId);
  });

  it("assigning a member clears any contact assignee already set", async () => {
    const caller = callerAs(adminId);
    const contact = await caller.contact.create({ organizationId: org.id, name: "Subcontractor" });
    const card = await caller.card.create({ boardId, columnId, title: "Assign test" });

    await caller.card.update({ cardId: card.id, assigneeContactId: contact.id });
    let fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assigneeContactId).toBe(contact.id);
    expect(fetched.assigneeId).toBeNull();

    await caller.card.update({ cardId: card.id, assigneeId: memberId });
    fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assigneeId).toBe(memberId);
    expect(fetched.assigneeContactId).toBeNull();
  });

  it("a card cannot be set as its own parent", async () => {
    const caller = callerAs(adminId);
    const card = await caller.card.create({ boardId, columnId, title: "Self parent test" });
    await expect(
      caller.card.update({ cardId: card.id, parentCardId: card.id }),
    ).rejects.toThrow();
  });

  it("a parent must be on the same board", async () => {
    const caller = callerAs(adminId);
    const otherBoard = await caller.board.create({ organizationId: org.id, name: "Other Board" });
    const otherColumn = await caller.column.create({ boardId: otherBoard.id, name: "Col" });
    const otherCard = await caller.card.create({
      boardId: otherBoard.id,
      columnId: otherColumn.id,
      title: "Elsewhere",
    });
    const card = await caller.card.create({ boardId, columnId, title: "Cross-board parent test" });

    await expect(
      caller.card.update({ cardId: card.id, parentCardId: otherCard.id }),
    ).rejects.toThrow();
  });

  it("moving a card into a blocked column auto-flags it, moving out auto-clears it", async () => {
    const caller = callerAs(adminId);
    const blockedColumn = await caller.column.create({ boardId, name: "Blocked" });
    await caller.column.update({ columnId: blockedColumn.id, isBlockedColumn: true });
    const card = await caller.card.create({ boardId, columnId, title: "Blocked-flow test" });

    const blocked = await caller.card.move({
      cardId: card.id,
      columnId: blockedColumn.id,
      beforePosition: null,
      afterPosition: null,
    });
    expect(blocked.isBlocked).toBe(true);

    const unblocked = await caller.card.move({
      cardId: card.id,
      columnId,
      beforePosition: null,
      afterPosition: null,
    });
    expect(unblocked.isBlocked).toBe(false);
  });
});
