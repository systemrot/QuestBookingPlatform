import { getSiteUrl, siteConfig } from "@/config/site";
import { dbUrgent } from "@/lib/prisma";

import { getManagerNotifyTo, getResendApiKey, getMailTransport, sendMail } from "./transport";

function formatRuDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(value: { toString(): string }): string {
  const n = Number(value.toString());
  if (Number.isNaN(n)) return value.toString();
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Письмо главному менеджеру: оплатили новую бронь.
 * Не бросает наружу — сбой почты не должен ломать оплату.
 */
export async function notifyManagerBookingPaid(bookingId: string): Promise<void> {
  try {
    const to = getManagerNotifyTo();
    const canSend = Boolean(getResendApiKey() || getMailTransport());
    if (!canSend) {
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[mail] skip manager notify: set RESEND_API_KEY (preferred) or SMTP_*"
        );
      }
      return;
    }

    const booking = await dbUrgent((prisma) =>
      prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          paymentId: true,
          note: true,
          user: { select: { name: true, email: true, phone: true } },
          slot: {
            select: {
              startTime: true,
              endTime: true,
              price: true,
              quest: {
                select: {
                  title: true,
                  city: { select: { name: true } },
                },
              },
            },
          },
        },
      })
    );

    if (!booking) return;

    const siteUrl = getSiteUrl();
    const quest = booking.slot.quest.title;
    const city = booking.slot.quest.city.name;
    const when = formatRuDateTime(booking.slot.startTime);
    const price = formatPrice(booking.slot.price);
    const guest = booking.user.name;
    const email = booking.user.email;
    const phone = booking.user.phone?.trim() || "—";

    const subject = `Оплата: ${quest} · ${when}`;
    const text = [
      `Новая оплаченная бронь на ${siteConfig.brandName}`,
      "",
      `Квест: ${quest}`,
      `Город: ${city}`,
      `Когда: ${when} (МСК)`,
      `Сумма: ${price}`,
      "",
      `Гость: ${guest}`,
      `Email: ${email}`,
      `Телефон: ${phone}`,
      "",
      `ID брони: ${booking.id}`,
      booking.paymentId ? `Платёж: ${booking.paymentId}` : null,
      booking.note?.trim() ? `Заметка: ${booking.note.trim()}` : null,
      "",
      `Админка: ${siteUrl}/admin`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
        <h2 style="margin:0 0 12px">Новая оплаченная бронь</h2>
        <p style="margin:0 0 16px;color:#444">${siteConfig.brandName}</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px">
          <tr><td style="padding:6px 0;color:#666">Квест</td><td style="padding:6px 0"><strong>${escapeHtml(quest)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666">Город</td><td style="padding:6px 0">${escapeHtml(city)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Когда</td><td style="padding:6px 0">${escapeHtml(when)} (МСК)</td></tr>
          <tr><td style="padding:6px 0;color:#666">Сумма</td><td style="padding:6px 0">${escapeHtml(price)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Гость</td><td style="padding:6px 0">${escapeHtml(guest)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Телефон</td><td style="padding:6px 0">${escapeHtml(phone)}</td></tr>
        </table>
        <p style="margin:20px 0 0">
          <a href="${siteUrl}/admin" style="color:#b91c1c">Открыть админку</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:#888">ID: ${escapeHtml(booking.id)}</p>
      </div>
    `.trim();

    const sent = await sendMail({ to, subject, text, html });
    if (!sent) {
      console.info("[mail] skip manager notify: no RESEND_API_KEY / SMTP_*");
    }
  } catch (e) {
    console.error("[mail] notifyManagerBookingPaid failed", e);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
