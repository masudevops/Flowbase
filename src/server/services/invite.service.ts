import { randomUUID } from "node:crypto";
import { Prisma as PrismaNS } from "@prisma/client";
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

function mapInviteRow(row: InviteLookupRow) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    role: row.role,
    organization: { name: row.organization_name, slug: row.organization_slug },
  };
}

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

  return mapInviteRow(row);
}

/// Same shape as getInviteByToken, but keyed by id instead of token —
/// backs acceptInviteById, used from /onboarding's "Join {org}" list
/// (see listPendingInvitesForEmail below), which surfaces invite ids
/// rather than raw tokens to the client.
async function getInviteById(id: string) {
  const rows = await prisma.$queryRaw<InviteLookupRow[]>`
    select * from app.get_invite_by_id(${id})
  `;
  const row = rows[0];

  if (!row || row.status !== "INVITED" || row.expires_at < new Date()) {
    return null;
  }

  return mapInviteRow(row);
}

/// Powers /onboarding's fallback: a signed-in user with a pending invite
/// sees "Join {org}" even if the invite token didn't survive the
/// signup/login redirect chain (e.g. they navigated away from the
/// emailed link and came back later). Only ever called with the caller's
/// own verified email (see membership.listMyInvites), never
/// user-suppliable input — this isn't a general invite-lookup-by-email
/// endpoint.
export async function listPendingInvitesForEmail(email: string) {
  const rows = await prisma.$queryRaw<InviteLookupRow[]>`
    select * from app.get_invites_by_email(${email})
  `;
  return rows.map((row) => ({
    id: row.id,
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
    role: row.role,
  }));
}

/// Shared by acceptInvite (by token) and acceptInviteById (by id, from
/// /onboarding's "Join {org}" list) once each has resolved and validated
/// its own invite lookup. Runs inside the caller's normal RLS-scoped
/// transaction. Uses a raw INSERT (no RETURNING) for the membership row
/// for the same reason createOrganization does in
/// organization.service.ts: Postgres also enforces the table's SELECT
/// policy against a RETURNING row, and this user isn't visible to that
/// SELECT policy (current_org_ids()) until the row exists — Prisma's
/// .create() always does RETURNING, so it hits that chicken-and-egg
/// wall. Once the raw insert lands, current_org_ids() sees it within the
/// same transaction, so the audit log write and the invite delete right
/// after (both normal Prisma calls) go through fine.
async function joinOrgFromInvite(
  db: Prisma.TransactionClient,
  invite: NonNullable<Awaited<ReturnType<typeof getInviteByToken>>>,
  userId: string,
) {
  try {
    await db.$executeRaw`
      insert into memberships (id, organization_id, user_id, role, status, created_at)
      values (${randomUUID()}, ${invite.organizationId}, ${userId}, ${invite.role}::"MembershipRole", 'ACTIVE', now())
    `;
  } catch (err) {
    // Double-submit race (e.g. accept clicked twice): the unique
    // (organization_id, user_id) constraint rejects the second insert.
    // ON CONFLICT DO NOTHING isn't usable here — Postgres RLS requires
    // SELECT-policy visibility on the conflict target row even for DO
    // NOTHING, which this not-yet-a-member user doesn't have, and that
    // turns into the same "violates row-level security policy" error
    // instead of a clean no-op.
    const isUniqueViolation =
      err instanceof PrismaNS.PrismaClientKnownRequestError &&
      err.meta?.code === "23505";
    if (!isUniqueViolation) throw err;
  }

  await writeAuditLog(db, {
    organizationId: invite.organizationId,
    actorId: userId,
    action: "MEMBER_INVITED",
    entityType: "membership",
    entityId: userId,
    metadata: { via: "invite" },
  });

  await db.invite.delete({ where: { id: invite.id } });

  return { organizationSlug: invite.organization.slug };
}

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
  return joinOrgFromInvite(db, invite, params.userId);
}

/// Backs /onboarding's "Join {org}" list (see listPendingInvitesForEmail
/// above) — same acceptance logic as acceptInvite, just keyed by the
/// invite id that endpoint returns instead of the raw token, since a
/// list of a user's own pending invites has no reason to expose the
/// bearer-credential token for each one.
export async function acceptInviteById(
  db: Prisma.TransactionClient,
  params: { inviteId: string; userId: string; userEmail: string },
) {
  const invite = await getInviteById(params.inviteId);
  if (!invite) {
    throw new TRPCError({ code: "NOT_FOUND", message: "This invite is invalid or has expired." });
  }
  if (invite.email.toLowerCase() !== params.userEmail.toLowerCase()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This invite was sent to a different email address.",
    });
  }
  return joinOrgFromInvite(db, invite, params.userId);
}
