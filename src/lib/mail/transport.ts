import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

/** Returns null when SMTP is not configured (emails are skipped). */
export function getMailTransport(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    transporter = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT || "587");
  const secure =
    process.env.SMTP_SECURE === "1" ||
    process.env.SMTP_SECURE === "true" ||
    port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

export function getMailFrom(): string {
  const configured =
    process.env.MAIL_FROM?.trim() || process.env.SMTP_FROM?.trim();
  if (configured) return configured;
  // Until nekvest.ru is verified in Resend, use their onboarding sender.
  if (getResendApiKey()) return "НеКвест <onboarding@resend.dev>";
  return process.env.SMTP_USER?.trim() || "НеКвест <noreply@nekvest.ru>";
}

/** Manager inbox — receives paid-booking alerts (no setup on his side). */
export function getManagerNotifyTo(): string {
  return (
    process.env.MAIL_MANAGER_TO?.trim() || "maks.levin98@mail.ru"
  );
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Prefer Resend API (our sender identity). Fall back to SMTP if configured.
 * Returns false when nothing is configured.
 */
export async function sendMail(input: SendMailInput): Promise<boolean> {
  const from = getMailFrom();
  const resendKey = getResendApiKey();

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`resend ${res.status}: ${body.slice(0, 300)}`);
    }
    return true;
  }

  const transport = getMailTransport();
  if (!transport) return false;

  await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  return true;
}
