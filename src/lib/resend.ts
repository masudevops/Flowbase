import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/// Fire-and-forget email send: logs failures instead of throwing, since
/// no notification email should ever block or fail the mutation that
/// triggered it (assigning a card, posting a comment, ...).
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Flowbase <onboarding@resend.dev>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[email] send failed:", error);
    }
  } catch (err) {
    console.error("[email] send threw:", err);
  }
}
