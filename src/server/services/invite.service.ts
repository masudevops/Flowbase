import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "../permissions";
import { writeAuditLog } from "./audit.service";
import { sendInviteEmail } from "./notification.service";

const INVITE_TTL_DAYS = 14;

export async function createInvite(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorId: string;
    email: string;
    role: "ADMIN" | "MEMBER";
  },
) {
  await assertAdmin(db, params.organizationId, params.actorId);

  const email = params.email.toLowerCase();

  const [organization, actor, existingUser] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: params.organizationId } }),
    db.user.findUnique({ where: { id: params.actorId } }),
    db.user.findUnique({ where: { email } }),
  ]);

  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: { organizationId_userId: { organizationId: params.organizationId, userId: existingUser.id } },
    });
    if (existingMembership) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "That person is already a member." });
    }
  }

  const invite = await db.invite.upsert({
    where: { organizationId_email: { organizationId: params.organizationId, email } },
    create: {
      organizationId: params.organizationId,
      email,
      role: params.role,
      invitedById: params.actorId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
    update: {
      role: params.role,
      invitedById: params.actorId,
      status: "INVITED",
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  await writeAuditLog(db, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: "MEMBER_INVITED",
    entityType: "invite",
    entityId: invite.id,
    metadata: { email, role: params.role },
  });

  await sendInviteEmail({
    to: email,
    organizationName: organization.name,
    inviterName: actor?.fullName ?? actor?.email ?? "A teammate",
    token: invite.token,
    role: params.role,
  });

  return invite;
}

export async function listPendingInvites(db: Prisma.TransactionClient, organizationId: string) {
  return db.invite.findMany({
    where: { organizationId, status: "INVITED" },
    orderBy: { createdAt: "desc" },
  });
}

export async function cancelInvite(
  db: Prisma.TransactionClient,
  params: { organizationId: string; actorId: string; inviteId: string },
) {
  await assertAdmin(db, params.organizationId, params.actorId);

  const invite = await db.invite.findUnique({ where: { id: params.inviteId } });
  if (!invite || invite.organizationId !== params.organizationId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  await db.invite.delete({ where: { id: params.inviteId } });
  return { ok: true };
}

type InviteLookupRow = {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: string;
  expires_at: Date;
};

/// Someone redeeming an invite link isn't a member of the org yet (and
/// may not even be logged in), so the normal RLS-scoped path can't SELECT
/// the invite row. Calls the app.get_invite_by_token SECURITY DEFINER SQL
/// function (prisma/rls/005_invite_lookup.sql) instead — token possession
/// is the authorization, the same trust model as a password reset link.
/// Safe to call outside withRlsContext: the function bypasses RLS on its
/// own regardless of session state.
export async function getInviteByToken(token: string) {
  const rows = await prisma.$queryRaw<InviteLookupRow[]>`
    select * from app.get_invite_by_token(${token})
  `;
  const row = rows[0];

  if (!row || row.status !== "INVITED" || row.expires_at < new Date()) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    role: row.role,
    organization: { name: row.organization_name, slug: row.organization_slug },
  };
}

/// Runs inside the caller's normal RLS-scoped transaction. Uses a raw
/// INSERT (no RETURNING) for the membership row for the same reason
/// createOrganization does in organization.service.ts: Postgres also
/// enforces the table's SELECT policy against a RETURNING row, and this
/// user isn't visible to that SELECT policy (current_org_ids()) until
/// the row exists — Prisma's .create() always does RETURNING, so it hits
/// that chicken-and-egg wall. Once the raw insert lands, current_org_ids()
/// sees it within the same transaction, so the audit log write and the
/// invite delete right after (both normal Prisma calls) go through fine.
export async function acceptInvite(
  db: Prisma.TransactionClient,
  params: { token: string; userId: string; userEmail: string },
) {
  const invite = await getInviteByToken(params.token);
  if (!invite) {
    throw new TRPCError({ code: "NOT_FOUND", message: "This invite is invalid or has expired." });
  }
  if (invite.email.toLowerCase() !== params.userEmail.toLowerCase()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This invite was sent to a different email address.",
    });
  }

  await db.$executeRaw`
    insert into memberships (id, organization_id, user_id, role, status, created_at)
    values (${randomUUID()}, ${invite.organizationId}, ${params.userId}, ${invite.role}::"MembershipRole", 'ACTIVE', now())
    on conflict (organization_id, user_id) do nothing
  `;

  await writeAuditLog(db, {
    organizationId: invite.organizationId,
    actorId: params.userId,
    action: "MEMBER_INVITED",
    entityType: "membership",
    entityId: params.userId,
    metadata: { via: "invite" },
  });

  await db.invite.delete({ where: { id: invite.id } });

  return { organizationSlug: invite.organization.slug };
}
