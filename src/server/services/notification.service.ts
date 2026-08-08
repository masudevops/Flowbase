import type { Prisma } from "@prisma/client";
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
      <p style="margin-top: 32px; font-size: 12px; color: #5E6C84;">Flowbase</p>
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

  const url = await cardLink(db, card);
  await sendEmail({
    to: assignee.email,
    subject: `You were assigned: ${card.title}`,
    html: emailShell(
      `<p>${actor?.fullName ?? actor?.email ?? "Someone"} assigned you a card:</p>
       <p style="font-weight: 600; font-size: 16px;">${card.title}</p>`,
      url,
      "View card",
    ),
  });
}

/// Notifies a card's assignee about a new comment. Never notifies
/// someone of their own comment.
export async function notifyNewComment(
  db: Prisma.TransactionClient,
  params: { cardId: string; authorId: string; body: string },
) {
  const card = await db.card.findUnique({ where: { id: params.cardId } });
  if (!card || !card.assigneeId || card.assigneeId === params.authorId) return;

  const [assignee, author] = await Promise.all([
    db.user.findUnique({ where: { id: card.assigneeId } }),
    db.user.findUnique({ where: { id: params.authorId } }),
  ]);
  if (!assignee) return;

  const url = await cardLink(db, card);
  await sendEmail({
    to: assignee.email,
    subject: `New comment on: ${card.title}`,
    html: emailShell(
      `<p>${author?.fullName ?? author?.email ?? "Someone"} commented on a card you're assigned to:</p>
       <p style="font-weight: 600; font-size: 16px;">${card.title}</p>
       <p style="color: #5E6C84; white-space: pre-wrap;">${params.body}</p>`,
      url,
      "View card",
    ),
  });
}
