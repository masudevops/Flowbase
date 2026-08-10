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
  type TestUser,
} from "./helpers/fixtures";

/// Admin/member permission boundaries, and the "an org always has at
/// least one admin" invariant (src/server/services/membership.service.ts).
describe("membership authorization", () => {
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  const orgIds: string[] = [];
  const userIds: string[] = [];

  let org: TestOrg;
  let admin: TestUser;
  let member: TestUser;
  let adminMembershipId: string;
  let memberMembershipId: string;

  beforeAll(async () => {
    await db.connect();
    org = await createTestOrg(db, "Membership Auth Org");
    orgIds.push(org.id);

    admin = await createTestUser(db);
    member = await createTestUser(db);
    userIds.push(admin.id, member.id);
    await addMember(db, org.id, admin.id, "ADMIN");
    await addMember(db, org.id, member.id, "MEMBER");

    const memberships = await callerAs(admin.id).membership.list({ organizationId: org.id });
    adminMembershipId = memberships.find((m) => m.userId === admin.id)!.id;
    memberMembershipId = memberships.find((m) => m.userId === member.id)!.id;
  });

  afterAll(async () => {
    await deleteTestOrgs(db, orgIds);
    await deleteTestUsers(db, userIds);
    await db.end();
  });

  it("a member cannot invite new people", async () => {
    await expect(
      callerAs(member.id).membership.invite({
        organizationId: org.id,
        email: "invitee@example.test",
        role: "MEMBER",
      }),
    ).rejects.toThrow();
  });

  it("an admin can invite new people", async () => {
    const invite = await callerAs(admin.id).membership.invite({
      organizationId: org.id,
      email: "invitee2@example.test",
      role: "MEMBER",
    });
    expect(invite.email).toBe("invitee2@example.test");
  });

  it("a member cannot rename the workspace", async () => {
    await expect(
      callerAs(member.id).organization.update({ organizationId: org.id, name: "Hijacked Name" }),
    ).rejects.toThrow();
  });

  it("an admin can rename the workspace", async () => {
    const updated = await callerAs(admin.id).organization.update({
      organizationId: org.id,
      name: "Renamed By Admin",
    });
    expect(updated.name).toBe("Renamed By Admin");
  });

  it("a member cannot change another member's role", async () => {
    await expect(
      callerAs(member.id).membership.updateRole({
        organizationId: org.id,
        membershipId: memberMembershipId,
        role: "ADMIN",
      }),
    ).rejects.toThrow();
  });

  it("a member cannot remove another member", async () => {
    await expect(
      callerAs(member.id).membership.remove({
        organizationId: org.id,
        membershipId: adminMembershipId,
      }),
    ).rejects.toThrow();
  });

  it("cannot demote the org's only admin", async () => {
    await expect(
      callerAs(admin.id).membership.updateRole({
        organizationId: org.id,
        membershipId: adminMembershipId,
        role: "MEMBER",
      }),
    ).rejects.toThrow();
  });

  it("cannot remove the org's only admin", async () => {
    await expect(
      callerAs(admin.id).membership.remove({
        organizationId: org.id,
        membershipId: adminMembershipId,
      }),
    ).rejects.toThrow();
  });

  it("a member cannot delete a board", async () => {
    const board = await callerAs(admin.id).board.create({ organizationId: org.id, name: "Guarded Board" });
    await expect(callerAs(member.id).board.archive({ boardId: board.id })).rejects.toThrow();
  });

  it("an admin can delete a board", async () => {
    const board = await callerAs(admin.id).board.create({ organizationId: org.id, name: "Deletable Board" });
    const archived = await callerAs(admin.id).board.archive({ boardId: board.id });
    expect(archived.archivedAt).not.toBeNull();
  });
});
