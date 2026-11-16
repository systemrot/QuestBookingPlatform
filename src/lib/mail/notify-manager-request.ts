import { getSiteUrl, siteConfig } from "@/config/site";
import { formatPhoneDisplay } from "@/lib/phone";
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type NotifyKind = "created" | "cancelled";

/**
 * Письмо менеджеру по заявке (создание / отмена клиентом).
 * Ошибки почты не пробрасываем наружу.
 */
export async function notifyManagerBookingRequest(
  bookingId: string,
  kind: NotifyKind = "created"
): Promise<void> {
  try {
    const to = getManagerNotifyTo();
    const canSend = Boolean(getResendApiKey() || getMailTransport());
    if (!canSend) {
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[mail] skip manager request notify: set RESEND_API_KEY or SMTP_*"
        );
      }
      return;
    }

    const booking = await dbUrgent((prisma) =>
      prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
          partySize: true,
          note: true,
          createdAt: true,
          userId: true,
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
    const name =
      booking.contactName?.trim() ||
      booking.user?.name?.trim() ||
      "—";
    const phoneRaw =
      booking.contactPhone?.trim() ||
      booking.user?.phone?.trim() ||
      "";
    const phone = phoneRaw ? formatPhoneDisplay(phoneRaw) : "—";
    const email =
      booking.contactEmail?.trim() ||
      booking.user?.email?.trim() ||
      "—";
    const party =
      typeof booking.partySize === "number" ? String(booking.partySize) : "—";
    const account = booking.userId
      ? `аккаунт (${booking.user?.email ?? booking.userId})`
      : "гость без аккаунта";
    const created = formatRuDateTime(booking.createdAt);

    const isCancel = kind === "cancelled";
    const subject = isCancel
      ? `Отмена заявки: ${quest} · ${when}`
      : `Заявка: ${quest} · ${when}`;
    const headline = isCancel
      ? "Клиент отменил заявку"
      : "Новая заявка на созвон";

    const text = [
      `${headline} — ${siteConfig.brandName}`,
      "",
      `Квест: ${quest}`,
      `Город: ${city}`,
      `Желаемое время: ${when} (МСК)`,
      `Людей: ${party}`,
      "",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Email: ${email}`,
      `Источник: ${account}`,
      `Создана: ${created}`,
      "",
      `ID заявки: ${booking.id}`,
      booking.note?.trim() ? `Заметка: ${booking.note.trim()}` : null,
      "",
      `Админка: ${siteUrl}/admin`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
        <h2 style="margin:0 0 12px">${escapeHtml(headline)}</h2>
        <p style="margin:0 0 16px;color:#444">${escapeHtml(siteConfig.brandName)}</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px">
          <tr><td style="padding:6px 0;color:#666">Квест</td><td style="padding:6px 0"><strong>${escapeHtml(quest)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666">Город</td><td style="padding:6px 0">${escapeHtml(city)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Желаемое время</td><td style="padding:6px 0">${escapeHtml(when)} (МСК)</td></tr>
          <tr><td style="padding:6px 0;color:#666">Людей</td><td style="padding:6px 0">${escapeHtml(party)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Имя</td><td style="padding:6px 0">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Телефон</td><td style="padding:6px 0">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Источник</td><td style="padding:6px 0">${escapeHtml(account)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Создана</td><td style="padding:6px 0">${escapeHtml(created)}</td></tr>
        </table>
        <p style="margin:20px 0 0">
          <a href="${siteUrl}/admin" style="color:#b91c1c">Открыть админку</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:#888">ID: ${escapeHtml(booking.id)}</p>
      </div>
    `.trim();

    const sent = await sendMail({ to, subject, text, html });
    if (!sent) {
      console.info("[mail] skip manager request notify: no transport");
    }
  } catch (e) {
    console.error("[mail] notifyManagerBookingRequest failed", e);
  }
}
