import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { callerAs } from "./helpers/caller";
import {
  createTestOrg,
  createTestUser,
  addMember,
  deleteTestOrgs,
  deleteTestUsers,
  type TestOrg,
} from "./helpers/fixtures";

/// Covers Epic 10 (rollup custom fields): summing a NUMBER field across
/// a card's direct children, same-card-type scoping, and the
/// missing-value-contributes-0 (not null) behavior that deliberately
/// differs from Epic 9's Formula fields (src/lib/formula.ts's
/// evaluateRollup, src/server/routers/customField.ts's assertValidRollup).
describe("rollup custom fields", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];
  const userIds: string[] = [];

  let org: TestOrg;
  let adminId: string;
  let boardId: string;
  let columnId: string;
  let taskTypeId: string;
  let otherTypeId: string;
  let costFieldId: string;

  beforeAll(async () => {
    await db.connect();
    org = await createTestOrg(db, "Rollup Fields Org");
    orgIds.push(org.id);

    const admin = await createTestUser(db);
    adminId = admin.id;
    userIds.push(adminId);
    await addMember(db, org.id, adminId, "ADMIN");

    const caller = callerAs(adminId);
    const board = await caller.board.create({ organizationId: org.id, name: "Board" });
    boardId = board.id;
    const column = await caller.column.create({ boardId, name: "To Do" });
    columnId = column.id;
    const taskType = await caller.cardType.create({
      organizationId: org.id,
      boardId,
      name: "Punch Item",
      color: "#1D5C8A",
    });
    taskTypeId = taskType.id;
    const otherType = await caller.cardType.create({
      organizationId: org.id,
      boardId,
      name: "Note",
      color: "#6B7280",
    });
    otherTypeId = otherType.id;

    const costField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Cost",
      fieldType: "NUMBER",
    });
    costFieldId = costField.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await deleteTestUsers(db, userIds);
    await db.end();
  });

  it("sums a NUMBER field across same-type direct children", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Total Cost",
      fieldType: "ROLLUP",
      rollup: { sourceFieldId: costFieldId, aggregate: "SUM" },
    });

    const parent = await caller.card.create({ boardId, columnId, title: "Parent", cardTypeId: taskTypeId });
    for (const cost of [100, 200, 300]) {
      const child = await caller.card.create({ boardId, columnId, title: `Child ${cost}`, cardTypeId: taskTypeId });
      await caller.card.update({ cardId: child.id, parentCardId: parent.id });
      await caller.customField.setValue({ cardId: child.id, fieldDefinitionId: costFieldId, value: String(cost) });
    }

    const values = await caller.customField.listValues({ cardId: parent.id });
    expect(values.find((v) => v.fieldDefinitionId === totalField.id)?.value).toBe("600");
  });

  it("a child missing the source field's value contributes 0, not null for the whole rollup", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Total Cost Partial",
      fieldType: "ROLLUP",
      rollup: { sourceFieldId: costFieldId, aggregate: "SUM" },
    });

    const parent = await caller.card.create({ boardId, columnId, title: "Partial parent", cardTypeId: taskTypeId });
    const childWithValue = await caller.card.create({ boardId, columnId, title: "Has cost", cardTypeId: taskTypeId });
    await caller.card.update({ cardId: childWithValue.id, parentCardId: parent.id });
    await caller.customField.setValue({ cardId: childWithValue.id, fieldDefinitionId: costFieldId, value: "50" });

    const childNoValue = await caller.card.create({ boardId, columnId, title: "No cost set", cardTypeId: taskTypeId });
    await caller.card.update({ cardId: childNoValue.id, parentCardId: parent.id });

    const values = await caller.customField.listValues({ cardId: parent.id });
    expect(values.find((v) => v.fieldDefinitionId === totalField.id)?.value).toBe("50");
  });

  it("a child of a different card type is skipped, not counted as 0 or erroring", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Total Cost Mixed",
      fieldType: "ROLLUP",
      rollup: { sourceFieldId: costFieldId, aggregate: "SUM" },
    });

    const parent = await caller.card.create({ boardId, columnId, title: "Mixed parent", cardTypeId: taskTypeId });
    const matchingChild = await caller.card.create({ boardId, columnId, title: "Matching", cardTypeId: taskTypeId });
    await caller.card.update({ cardId: matchingChild.id, parentCardId: parent.id });
    await caller.customField.setValue({ cardId: matchingChild.id, fieldDefinitionId: costFieldId, value: "75" });

    const otherTypeChild = await caller.card.create({ boardId, columnId, title: "Other type", cardTypeId: otherTypeId });
    await caller.card.update({ cardId: otherTypeChild.id, parentCardId: parent.id });

    const values = await caller.customField.listValues({ cardId: parent.id });
    expect(values.find((v) => v.fieldDefinitionId === totalField.id)?.value).toBe("75");
  });

  it("a card with no children shows a rollup of 0, not null", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Total Cost Empty",
      fieldType: "ROLLUP",
      rollup: { sourceFieldId: costFieldId, aggregate: "SUM" },
    });

    const parent = await caller.card.create({ boardId, columnId, title: "Childless parent", cardTypeId: taskTypeId });
    const values = await caller.customField.listValues({ cardId: parent.id });
    expect(values.find((v) => v.fieldDefinitionId === totalField.id)?.value).toBe("0");
  });

  it("rejects a rollup referencing a field on a different card type", async () => {
    const caller = callerAs(adminId);
    const otherTypeField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: otherTypeId,
      name: "Other Type Number",
      fieldType: "NUMBER",
    });

    await expect(
      caller.customField.createDefinition({
        organizationId: org.id,
        cardTypeId: taskTypeId,
        name: "Cross-type rollup",
        fieldType: "ROLLUP",
        rollup: { sourceFieldId: otherTypeField.id, aggregate: "SUM" },
      }),
    ).rejects.toThrow();
  });

  it("rejects directly setting a value on a rollup field", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Direct Set Rollup Test",
      fieldType: "ROLLUP",
      rollup: { sourceFieldId: costFieldId, aggregate: "SUM" },
    });
    const parent = await caller.card.create({ boardId, columnId, title: "Direct set test", cardTypeId: taskTypeId });

    await expect(
      caller.customField.setValue({ cardId: parent.id, fieldDefinitionId: totalField.id, value: "999" }),
    ).rejects.toThrow();
  });
});
