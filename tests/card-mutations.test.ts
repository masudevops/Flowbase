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

  it("sets and clears a card's start date independently of its due date", async () => {
    const caller = callerAs(adminId);
    const card = await caller.card.create({ boardId, columnId, title: "Timeline test" });

    const withDates = await caller.card.update({
      cardId: card.id,
      startDate: "2026-01-05T00:00:00.000Z",
      dueDate: "2026-01-10T00:00:00.000Z",
    });
    expect(withDates.startDate?.toISOString()).toBe("2026-01-05T00:00:00.000Z");
    expect(withDates.dueDate?.toISOString()).toBe("2026-01-10T00:00:00.000Z");

    const clearedStart = await caller.card.update({ cardId: card.id, startDate: null });
    expect(clearedStart.startDate).toBeNull();
    expect(clearedStart.dueDate?.toISOString()).toBe("2026-01-10T00:00:00.000Z");
  });

  it("a card can be assigned to both a member and a contact at once", async () => {
    const caller = callerAs(adminId);
    const contact = await caller.contact.create({ organizationId: org.id, name: "Subcontractor" });
    const card = await caller.card.create({ boardId, columnId, title: "Assign test" });

    await caller.card.setAssignees({
      cardId: card.id,
      assignees: [{ userId: memberId }, { contactId: contact.id }],
    });
    const fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assignees).toHaveLength(2);
    expect(fetched.assignees.some((a) => a.user?.id === memberId)).toBe(true);
    expect(fetched.assignees.some((a) => a.contact?.id === contact.id)).toBe(true);
  });

  it("setAssignees replaces the full set — re-saving with fewer entries removes the rest", async () => {
    const caller = callerAs(adminId);
    const card = await caller.card.create({ boardId, columnId, title: "Replace assignees test" });

    await caller.card.setAssignees({
      cardId: card.id,
      assignees: [{ userId: adminId }, { userId: memberId }],
    });
    let fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assignees).toHaveLength(2);

    await caller.card.setAssignees({ cardId: card.id, assignees: [{ userId: memberId }] });
    fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assignees).toHaveLength(1);
    expect(fetched.assignees[0].user?.id).toBe(memberId);

    await caller.card.setAssignees({ cardId: card.id, assignees: [] });
    fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assignees).toHaveLength(0);
  });

  it("concurrent setAssignees calls for the same card don't corrupt into a merged/lost-update state (Epic 8.1)", async () => {
    const caller = callerAs(adminId);
    const contact = await caller.contact.create({ organizationId: org.id, name: "Race Contact" });
    const card = await caller.card.create({ boardId, columnId, title: "Assignee race test" });

    // Three overlapping requests for the same card, fired concurrently —
    // without the row lock in setCardAssignees, a "read current, diff,
    // write" pattern lets two transactions interleave and produce a
    // state that matches neither payload. The fix guarantees the final
    // state always matches exactly one of these three, never a mix.
    const payloads = [
      [{ userId: adminId }],
      [{ userId: memberId }],
      [{ contactId: contact.id }],
    ];
    await Promise.all(payloads.map((assignees) => caller.card.setAssignees({ cardId: card.id, assignees })));

    const fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.assignees).toHaveLength(1);
    const matchesOnePayload = payloads.some(
      (p) =>
        (p[0].userId && fetched.assignees[0].user?.id === p[0].userId) ||
        (p[0].contactId && fetched.assignees[0].contact?.id === p[0].contactId),
    );
    expect(matchesOnePayload).toBe(true);
  });

  it("concurrent setLabels calls for the same card don't corrupt into a merged/lost-update state (Epic 8.1)", async () => {
    const caller = callerAs(adminId);
    const labelA = await caller.label.create({ organizationId: org.id, name: "Race Label A" });
    const labelB = await caller.label.create({ organizationId: org.id, name: "Race Label B" });
    const labelC = await caller.label.create({ organizationId: org.id, name: "Race Label C" });
    const card = await caller.card.create({ boardId, columnId, title: "Label race test" });

    const payloads = [[labelA.id], [labelB.id], [labelC.id]];
    await Promise.all(payloads.map((labelIds) => caller.card.setLabels({ cardId: card.id, labelIds })));

    const fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.labels).toHaveLength(1);
    const matchesOnePayload = payloads.some((p) => fetched.labels[0].label.id === p[0]);
    expect(matchesOnePayload).toBe(true);
  });

  it("a card assigned to a member shows up in that member's My Work for every assignee, not just one", async () => {
    const caller = callerAs(adminId);
    const card = await caller.card.create({ boardId, columnId, title: "Shared assignment test" });
    await caller.card.setAssignees({
      cardId: card.id,
      assignees: [{ userId: adminId }, { userId: memberId }],
    });

    const adminWork = await callerAs(adminId).card.listAssignedToMe({ organizationId: org.id });
    const memberWork = await callerAs(memberId).card.listAssignedToMe({ organizationId: org.id });
    expect(adminWork.some((c) => c.id === card.id)).toBe(true);
    expect(memberWork.some((c) => c.id === card.id)).toBe(true);
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

  it("blocking a card with a same-board card reference sets and clears blockedByCardId", async () => {
    const caller = callerAs(adminId);
    const blocker = await caller.card.create({ boardId, columnId, title: "The blocker" });
    const card = await caller.card.create({ boardId, columnId, title: "Blocked-by test" });

    const blocked = await caller.card.toggleBlocked({
      cardId: card.id,
      isBlocked: true,
      blockedByCardId: blocker.id,
    });
    expect(blocked.blockedByCardId).toBe(blocker.id);

    const unblocked = await caller.card.toggleBlocked({ cardId: card.id, isBlocked: false });
    expect(unblocked.blockedByCardId).toBeNull();
  });

  it("a card cannot be blocked by itself", async () => {
    const caller = callerAs(adminId);
    const card = await caller.card.create({ boardId, columnId, title: "Self block test" });
    await expect(
      caller.card.toggleBlocked({ cardId: card.id, isBlocked: true, blockedByCardId: card.id }),
    ).rejects.toThrow();
  });

  it("blocked-by-card must be on the same board", async () => {
    const caller = callerAs(adminId);
    const otherBoard = await caller.board.create({ organizationId: org.id, name: "Other Board 2" });
    const otherColumn = await caller.column.create({ boardId: otherBoard.id, name: "Col" });
    const otherCard = await caller.card.create({
      boardId: otherBoard.id,
      columnId: otherColumn.id,
      title: "Elsewhere",
    });
    const card = await caller.card.create({ boardId, columnId, title: "Cross-board block test" });

    await expect(
      caller.card.toggleBlocked({ cardId: card.id, isBlocked: true, blockedByCardId: otherCard.id }),
    ).rejects.toThrow();
  });

  it("deleting the blocking card un-links it instead of touching the blocked card", async () => {
    const caller = callerAs(adminId);
    const blocker = await caller.card.create({ boardId, columnId, title: "Blocker to delete" });
    const card = await caller.card.create({ boardId, columnId, title: "Survives blocker deletion" });
    await caller.card.toggleBlocked({ cardId: card.id, isBlocked: true, blockedByCardId: blocker.id });

    await caller.card.delete({ cardId: blocker.id });

    const fetched = await caller.card.byId({ cardId: card.id });
    expect(fetched.isBlocked).toBe(true);
    expect(fetched.blockedByCardId).toBeNull();
  });
});
