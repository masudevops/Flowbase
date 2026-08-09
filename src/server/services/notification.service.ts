import { randomUUID } from "node:crypto";
import type { Prisma, NotificationType } from "@prisma/client";
import { sendEmail } from "@/lib/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function emailShell(bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #172B4D;">
      ${bodyHtml}
      <p style="margin-top: 24px;">
        <a href="${ctaUrl}" style="display: inline-block; background: #0B5CFF; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          ${ctaLabel}
        </a>
      </p>
      <p style="margin-top: 32px; font-size: 12px; color: #5E6C84;">Kelbara</p>
    </div>
  `;
}

async function cardLink(db: Prisma.TransactionClient, card: { organizationId: string; boardId: string; id: string }) {
  const org = await db.organization.findUnique({
    where: { id: card.organizationId },
    select: { slug: true },
  });
  return `${APP_URL}/w/${org?.slug}/boards/${card.boardId}?card=${card.id}`;
}

/// Writes the in-app activity-feed row. Raw INSERT with no RETURNING —
/// the actor writing this (assigning a card, commenting) is virtually
/// never the recipient, so a normal Prisma .create() would hit the
/// RETURNING-requires-SELECT-policy wall (see
/// prisma/rls/006_epics_notifications_automations.sql). actorId is
/// nullable for system-generated notifications (e.g. automations).
export async function createNotification(
  db: Prisma.TransactionClient,
  params: {
    organizationId: string;
    userId: string;
    type: NotificationType;
    message: string;
    cardId?: string | null;
    actorId?: string | null;
  },
) {
  await db.$executeRaw`
    insert into notifications (id, organization_id, user_id, type, card_id, actor_id, message, created_at)
    values (${randomUUID()}, ${params.organizationId}, ${params.userId}, ${params.type}::"NotificationType", ${params.cardId ?? null}, ${params.actorId ?? null}, ${params.message}, now())
  `;
}

/// Invites don't have a User row to look up yet, so this takes the raw
/// values instead of loading them from the DB like the other notifiers.
export async function sendInviteEmail(params: {
  to: string;
  organizationName: string;
  inviterName: string;
  token: string;
  role: string;
}) {
  const url = `${APP_URL}/invite/${params.token}`;
  await sendEmail({
    to: params.to,
    subject: `${params.inviterName} invited you to join ${params.organizationName} on Kelbara`,
    html: emailShell(
      `<p>${params.inviterName} invited you to join <strong>${params.organizationName}</strong> on Kelbara as a ${params.role === "ADMIN" ? "project manager" : "team member"}.</p>`,
      url,
      "Accept invite",
    ),
  });
}

/// Notifies a user they were assigned a card. Never notifies someone of
/// their own action (self-assignment).
export async function notifyCardAssigned(
  db: Prisma.TransactionClient,
  params: { cardId: string; assigneeId: string; actorId: string },
) {
  if (params.assigneeId === params.actorId) return;

  const [card, assignee, actor] = await Promise.all([
    db.card.findUnique({ where: { id: params.cardId } }),
    db.user.findUnique({ where: { id: params.assigneeId } }),
    db.user.findUnique({ where: { id: params.actorId } }),
  ]);
  if (!card || !assignee) return;

  const actorName = actor?.fullName ?? actor?.email ?? "Someone";
  const url = await cardLink(db, card);
  await sendEmail({
    to: assignee.email,
    subject: `You were assigned: ${card.title}`,
    html: emailShell(
      `<p>${actorName} assigned you a card:</p>
       <p style="font-weight: 600; font-size: 16px;">${card.title}</p>`,
      url,
      "View card",
    ),
  });

  await createNotification(db, {
    organizationId: card.organizationId,
    userId: assignee.id,
    type: "CARD_ASSIGNED",
    cardId: card.id,
    actorId: params.actorId,
    message: `${actorName} assigned you: ${card.title}`,
  });
}

/// Notifies every one of a card's (registered-user) assignees about a
/// new comment. Never notifies someone of their own comment. Contacts
/// have no login, so they never receive in-app/email notifications —
/// same as before this card supported more than one assignee.
export async function notifyNewComment(
  db: Prisma.TransactionClient,
  params: { cardId: string; authorId: string; body: string },
) {
  const card = await db.card.findUnique({ where: { id: params.cardId } });
  if (!card) return;

  const [assignees, author] = await Promise.all([
    db.cardAssignee.findMany({ where: { cardId: params.cardId, userId: { not: null } }, include: { user: true } }),
    db.user.findUnique({ where: { id: params.authorId } }),
  ]);
  const authorName = author?.fullName ?? author?.email ?? "Someone";
  const url = await cardLink(db, card);

  for (const { user: assignee } of assignees) {
    if (!assignee || assignee.id === params.authorId) continue;

    await sendEmail({
      to: assignee.email,
      subject: `New comment on: ${card.title}`,
      html: emailShell(
        `<p>${authorName} commented on a card you're assigned to:</p>
         <p style="font-weight: 600; font-size: 16px;">${card.title}</p>
         <p style="color: #5E6C84; white-space: pre-wrap;">${params.body}</p>`,
        url,
        "View card",
      ),
    });

    await createNotification(db, {
      organizationId: card.organizationId,
      userId: assignee.id,
      type: "COMMENT",
      cardId: card.id,
      actorId: params.authorId,
      message: `${authorName} commented on: ${card.title}`,
    });
  }
}

/// Fires when a board automation's trigger condition is met (currently:
/// card moved into a specific column). Notifies every one of the card's
/// (registered-user) assignees — skips whoever moved the card themselves
/// (nothing useful to tell them). actorId on the notification is null:
/// this is system-generated, not something the mover "did to" the
/// assignee the way a manual assignment is.
export async function notifyAutomationTriggered(
  db: Prisma.TransactionClient,
  params: { cardId: string; automationName: string; movedById: string },
) {
  const card = await db.card.findUnique({ where: { id: params.cardId } });
  if (!card) return;

  const assignees = await db.cardAssignee.findMany({
    where: { cardId: params.cardId, userId: { not: null } },
    include: { user: true },
  });
  const url = await cardLink(db, card);

  for (const { user: assignee } of assignees) {
    if (!assignee || assignee.id === params.movedById) continue;

    await sendEmail({
      to: assignee.email,
      subject: `Automation triggered: ${card.title}`,
      html: emailShell(
        `<p>The automation "${params.automationName}" ran on a card assigned to you:</p>
         <p style="font-weight: 600; font-size: 16px;">${card.title}</p>`,
        url,
        "View card",
      ),
    });

    await createNotification(db, {
      organizationId: card.organizationId,
      userId: assignee.id,
      type: "AUTOMATION",
      cardId: card.id,
      actorId: null,
      message: `Automation "${params.automationName}" ran on: ${card.title}`,
    });
  }
}
