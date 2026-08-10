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

/// Covers Epic 7 (custom fields): per-card-type scoping, tenant
/// isolation for both new tables, and basic value set/read — same shape
/// as cardtype-scoping.test.ts and tenant-isolation.test.ts.
describe("custom fields", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];
  const userIds: string[] = [];

  let orgA: TestOrg;
  let orgB: TestOrg;
  let adminA: string;
  let adminB: string;
  let boardAId: string;
  let bugTypeId: string;
  let featureTypeId: string;

  beforeAll(async () => {
    await db.connect();
    orgA = await createTestOrg(db, "Custom Fields Org A");
    orgB = await createTestOrg(db, "Custom Fields Org B");
    orgIds.push(orgA.id, orgB.id);

    const memberA = await createTestUser(db);
    const memberB = await createTestUser(db);
    adminA = memberA.id;
    adminB = memberB.id;
    userIds.push(adminA, adminB);
    await addMember(db, orgA.id, adminA, "ADMIN");
    await addMember(db, orgB.id, adminB, "ADMIN");

    const callerA = callerAs(adminA);
    const board = await callerA.board.create({ organizationId: orgA.id, name: "Board" });
    boardAId = board.id;
    const bugType = await callerA.cardType.create({
      organizationId: orgA.id,
      boardId: boardAId,
      name: "Bug",
      color: "#EF4444",
    });
    bugTypeId = bugType.id;
    const featureType = await callerA.cardType.create({
      organizationId: orgA.id,
      boardId: boardAId,
      name: "Feature",
      color: "#3B82F6",
    });
    featureTypeId = featureType.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await deleteTestUsers(db, userIds);
    await db.end();
  });

  it("a field defined on one card type does not appear on another, even on the same board", async () => {
    const caller = callerAs(adminA);
    await caller.customField.createDefinition({
      organizationId: orgA.id,
      cardTypeId: bugTypeId,
      name: "Severity",
      fieldType: "TEXT",
    });

    const bugFields = await caller.customField.listDefinitions({ cardTypeId: bugTypeId });
    const featureFields = await caller.customField.listDefinitions({ cardTypeId: featureTypeId });

    expect(bugFields.map((f) => f.name)).toContain("Severity");
    expect(featureFields.map((f) => f.name)).not.toContain("Severity");
  });

  it("a SELECT field requires at least one option", async () => {
    const caller = callerAs(adminA);
    await expect(
      caller.customField.createDefinition({
        organizationId: orgA.id,
        cardTypeId: bugTypeId,
        name: "Priority level",
        fieldType: "SELECT",
        options: [],
      }),
    ).rejects.toThrow();
  });

  it("sets and reads back a value for a card, and clearing it removes the row", async () => {
    const caller = callerAs(adminA);
    const field = await caller.customField.createDefinition({
      organizationId: orgA.id,
      cardTypeId: bugTypeId,
      name: "Repro steps",
      fieldType: "TEXT",
    });
    const column = await caller.column.create({ boardId: boardAId, name: "To Do" });
    const card = await caller.card.create({
      boardId: boardAId,
      columnId: column.id,
      title: "A bug",
      cardTypeId: bugTypeId,
    });

    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: field.id, value: "Click X, then Y" });
    let values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === field.id)?.value).toBe("Click X, then Y");

    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: field.id, value: null });
    values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === field.id)).toBeUndefined();
  });

  it("deleting a field definition removes its recorded values", async () => {
    const caller = callerAs(adminA);
    const field = await caller.customField.createDefinition({
      organizationId: orgA.id,
      cardTypeId: bugTypeId,
      name: "Temp field",
      fieldType: "TEXT",
    });
    const column = await caller.column.create({ boardId: boardAId, name: "Backlog" });
    const card = await caller.card.create({
      boardId: boardAId,
      columnId: column.id,
      title: "Another bug",
      cardTypeId: bugTypeId,
    });
    await caller.customField.setValue({ cardId: card.id, fieldDefinitionId: field.id, value: "temp" });

    await caller.customField.deleteDefinition({ fieldDefinitionId: field.id });

    const values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === field.id)).toBeUndefined();
  });

  it("cannot list another org's field definitions via its real card type id", async () => {
    const definitions = await callerAs(adminB).customField.listDefinitions({ cardTypeId: bugTypeId });
    expect(definitions).toEqual([]);
  });

  it("cannot set a value on another org's card by its real id", async () => {
    const caller = callerAs(adminA);
    const field = await caller.customField.createDefinition({
      organizationId: orgA.id,
      cardTypeId: bugTypeId,
      name: "Isolation test field",
      fieldType: "TEXT",
    });
    const column = await caller.column.create({ boardId: boardAId, name: "Isolation column" });
    const card = await caller.card.create({
      boardId: boardAId,
      columnId: column.id,
      title: "Isolation card",
      cardTypeId: bugTypeId,
    });

    await expect(
      callerAs(adminB).customField.setValue({ cardId: card.id, fieldDefinitionId: field.id, value: "hijacked" }),
    ).rejects.toThrow();

    const values = await caller.customField.listValues({ cardId: card.id });
    expect(values.find((v) => v.fieldDefinitionId === field.id)).toBeUndefined();
  });
});
