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

/// Covers Epic 9 (formula custom fields): correct computation, null
/// propagation for missing/divide-by-zero inputs, and the server-side
/// validation that a formula can only reference NUMBER fields on its
/// own card type (src/server/routers/customField.ts's assertValidFormula,
/// src/lib/formula.ts's evaluateFormula).
describe("formula custom fields", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];
  const userIds: string[] = [];

  let org: TestOrg;
  let adminId: string;
  let boardId: string;
  let taskTypeId: string;
  let otherTypeId: string;
  let quantityFieldId: string;
  let unitCostFieldId: string;
  let notesFieldId: string;

  beforeAll(async () => {
    await db.connect();
    org = await createTestOrg(db, "Formula Fields Org");
    orgIds.push(org.id);

    const admin = await createTestUser(db);
    adminId = admin.id;
    userIds.push(adminId);
    await addMember(db, org.id, adminId, "ADMIN");

    const caller = callerAs(adminId);
    const board = await caller.board.create({ organizationId: org.id, name: "Board" });
    boardId = board.id;
    const taskType = await caller.cardType.create({
      organizationId: org.id,
      boardId,
      name: "Task",
      color: "#1D5C8A",
    });
    taskTypeId = taskType.id;
    const otherType = await caller.cardType.create({
      organizationId: org.id,
      boardId,
      name: "Other",
      color: "#6B7280",
    });
    otherTypeId = otherType.id;

    const quantityField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Quantity",
      fieldType: "NUMBER",
    });
    quantityFieldId = quantityField.id;
    const unitCostField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Unit Cost",
      fieldType: "NUMBER",
    });
    unitCostFieldId = unitCostField.id;
    const notesField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Notes",
      fieldType: "TEXT",
    });
    notesFieldId = notesField.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await deleteTestUsers(db, userIds);
    await db.end();
  });

  it("computes a formula from two sibling NUMBER fields", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Total",
      fieldType: "FORMULA",
      formula: { leftFieldId: quantityFieldId, operator: "*", right: { type: "field", fieldId: unitCostFieldId } },
    });

    const column = await caller.column.create({ boardId, name: "To Do" });
    const card = await caller.card.create({ boardId, columnId: column.id, title: "Formula test", cardTypeId: taskTypeId });

    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: quantityFieldId, value: "4" });
    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: unitCostFieldId, value: "25" });

    const values = await caller.customField.listValues({ cardId: card.id });
    const total = values.find((v) => v.fieldDefinitionId === totalField.id);
    expect(total?.value).toBe("100");
  });

  it("computes with a constant instead of a second field", async () => {
    const caller = callerAs(adminId);
    const doubledField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Doubled Quantity",
      fieldType: "FORMULA",
      formula: { leftFieldId: quantityFieldId, operator: "*", right: { type: "constant", value: 2 } },
    });

    const column = await caller.column.create({ boardId, name: "Constant Test Col" });
    const card = await caller.card.create({ boardId, columnId: column.id, title: "Constant test", cardTypeId: taskTypeId });
    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: quantityFieldId, value: "6" });

    const values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === doubledField.id)?.value).toBe("12");
  });

  it("shows null when a referenced field's value is missing", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Total Missing Test",
      fieldType: "FORMULA",
      formula: { leftFieldId: quantityFieldId, operator: "*", right: { type: "field", fieldId: unitCostFieldId } },
    });

    const column = await caller.column.create({ boardId, name: "Missing Value Col" });
    const card = await caller.card.create({ boardId, columnId: column.id, title: "Missing value test", cardTypeId: taskTypeId });
    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: quantityFieldId, value: "10" });
    // unitCostFieldId deliberately left unset

    const values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === totalField.id)?.value).toBeNull();
  });

  it("shows null instead of Infinity/NaN on divide by zero", async () => {
    const caller = callerAs(adminId);
    const ratioField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Ratio",
      fieldType: "FORMULA",
      formula: { leftFieldId: quantityFieldId, operator: "/", right: { type: "field", fieldId: unitCostFieldId } },
    });

    const column = await caller.column.create({ boardId, name: "Divide Zero Col" });
    const card = await caller.card.create({ boardId, columnId: column.id, title: "Divide by zero test", cardTypeId: taskTypeId });
    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: quantityFieldId, value: "10" });
    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: unitCostFieldId, value: "0" });

    const values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === ratioField.id)?.value).toBeNull();
  });

  it("rejects a formula referencing a field from a different card type", async () => {
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
        name: "Cross-type formula",
        fieldType: "FORMULA",
        formula: { leftFieldId: quantityFieldId, operator: "*", right: { type: "field", fieldId: otherTypeField.id } },
      }),
    ).rejects.toThrow();
  });

  it("rejects a formula referencing a non-NUMBER field", async () => {
    const caller = callerAs(adminId);
    await expect(
      caller.customField.createDefinition({
        organizationId: org.id,
        cardTypeId: taskTypeId,
        name: "Text formula",
        fieldType: "FORMULA",
        formula: { leftFieldId: quantityFieldId, operator: "*", right: { type: "field", fieldId: notesFieldId } },
      }),
    ).rejects.toThrow();
  });

  it("rejects directly setting a value on a formula field", async () => {
    const caller = callerAs(adminId);
    const totalField = await caller.customField.createDefinition({
      organizationId: org.id,
      cardTypeId: taskTypeId,
      name: "Direct Set Test",
      fieldType: "FORMULA",
      formula: { leftFieldId: quantityFieldId, operator: "+", right: { type: "field", fieldId: unitCostFieldId } },
    });
    const column = await caller.column.create({ boardId, name: "Direct Set Col" });
    const card = await caller.card.create({ boardId, columnId: column.id, title: "Direct set test", cardTypeId: taskTypeId });

    await expect(
      caller.customField.setValue({ cardId: card.id, fieldDefinitionId: totalField.id, value: "999" }),
    ).rejects.toThrow();
  });
});
