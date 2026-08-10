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

/// Proves Build #5's data-driven template architecture: templates are
/// per-org rows (not globals), custom "save as template" produces an
/// independent snapshot, applying a template to a new board creates the
/// right columns/card types and records sourceTemplateId, and none of
/// this crosses tenant boundaries.
describe("workflow templates", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];
  const userIds: string[] = [];

  let orgA: TestOrg;
  let orgB: TestOrg;
  let adminAId: string;
  let adminBId: string;

  beforeAll(async () => {
    await db.connect();
    orgA = await createTestOrg(db, "Templates Org A");
    orgB = await createTestOrg(db, "Templates Org B");
    orgIds.push(orgA.id, orgB.id);

    const adminA = await createTestUser(db);
    adminAId = adminA.id;
    userIds.push(adminAId);
    await addMember(db, orgA.id, adminAId, "ADMIN");

    const adminB = await createTestUser(db);
    adminBId = adminB.id;
    userIds.push(adminBId);
    await addMember(db, orgB.id, adminBId, "ADMIN");
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await deleteTestUsers(db, userIds);
    await db.end();
  });

  it("a template saved from a board captures its current columns and card types", async () => {
    const caller = callerAs(adminAId);
    const board = await caller.board.create({ organizationId: orgA.id, name: "Custom Flow" });

    await caller.column.create({ boardId: board.id, name: "Backlog" });
    await caller.column.create({ boardId: board.id, name: "Doing" });
    await caller.cardType.create({ organizationId: orgA.id, boardId: board.id, name: "Ticket", color: "#3B82F6" });

    const saved = await caller.workflowTemplate.saveFromBoard({
      organizationId: orgA.id,
      boardId: board.id,
      name: "My Custom Workflow",
    });

    expect(saved.isBuiltIn).toBe(false);
    expect(saved.createdById).toBe(adminAId);

    const templates = await caller.workflowTemplate.list({ organizationId: orgA.id });
    const found = templates.find((t) => t.id === saved.id)!;
    expect(found.columns.map((c) => c.name)).toEqual(["Backlog", "Doing"]);
    expect(found.cardTypes.map((c) => c.name)).toEqual(["Ticket"]);
  });

  it("applying a template to a new board creates matching columns/card types and sets sourceTemplateId", async () => {
    const caller = callerAs(adminAId);
    const templates = await caller.workflowTemplate.list({ organizationId: orgA.id });
    const custom = templates.find((t) => t.name === "My Custom Workflow")!;

    const board = await caller.board.create({
      organizationId: orgA.id,
      name: "Applied From Custom",
      templateId: custom.id,
    });

    expect(board.sourceTemplateId).toBe(custom.id);

    const boardWithColumns = await caller.board.byId({ boardId: board.id });
    const cardTypes = await caller.cardType.list({ boardId: board.id });
    expect(boardWithColumns.columns.map((c) => c.name)).toEqual(["Backlog", "Doing"]);
    expect(cardTypes.map((c) => c.name)).toEqual(["Ticket"]);
  });

  it("a template in one org is invisible to another org, even when queried by id", async () => {
    const callerA = callerAs(adminAId);
    const callerB = callerAs(adminBId);

    const templatesA = await callerA.workflowTemplate.list({ organizationId: orgA.id });
    const customTemplateId = templatesA.find((t) => t.name === "My Custom Workflow")!.id;

    // Org B member passing org A's id as the organizationId gets RLS-filtered, not org A's data.
    const crossQuery = await callerB.workflowTemplate.list({ organizationId: orgA.id });
    expect(crossQuery.map((t) => t.id)).not.toContain(customTemplateId);

    // Org B member cannot delete org A's template.
    await expect(callerB.workflowTemplate.delete({ templateId: customTemplateId })).rejects.toThrow();

    // The template must still exist for org A afterward.
    const stillThere = await callerA.workflowTemplate.list({ organizationId: orgA.id });
    expect(stillThere.map((t) => t.id)).toContain(customTemplateId);
  });

  it("deleting a custom template does not affect boards already created from it", async () => {
    const caller = callerAs(adminAId);
    const templates = await caller.workflowTemplate.list({ organizationId: orgA.id });
    const custom = templates.find((t) => t.name === "My Custom Workflow")!;

    const boards = await caller.board.list({ organizationId: orgA.id });
    const boardId = boards.find((b) => b.name === "Applied From Custom")!.id;

    await caller.workflowTemplate.delete({ templateId: custom.id });

    // The board's columns/card types are its own rows, independent of the
    // template — deleting the template only nulls out the informational
    // back-reference (Board.sourceTemplateId: onDelete SetNull).
    const board = await caller.board.byId({ boardId });
    expect(board.sourceTemplateId).toBeNull();
    expect(board.columns.map((c) => c.name)).toEqual(["Backlog", "Doing"]);

    const templatesAfter = await caller.workflowTemplate.list({ organizationId: orgA.id });
    expect(templatesAfter.map((t) => t.id)).not.toContain(custom.id);
  });
});
