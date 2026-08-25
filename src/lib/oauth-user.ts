import type { Role } from "@/generated/prisma";
import { db } from "@/lib/prisma";
import { parseOptionalRuPhone } from "@/lib/ru-phone";

type OAuthUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
};

function normalizeOAuthPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const parsed = parseOptionalRuPhone(raw);
  if (!parsed.ok || !parsed.value) {
    console.warn("[oauth] Yandex phone ignored:", parsed.ok ? "empty" : parsed.message);
    return null;
  }
  return parsed.value;
}

export async function upsertUserFromOAuth(params: {
  email: string;
  name: string;
  phoneRaw?: string | null;
}): Promise<{ ok: true; user: OAuthUser } | { ok: false; reason: "no-email" }> {
  const email = params.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, reason: "no-email" };
  }

  const phone = normalizeOAuthPhone(params.phoneRaw);

  const existing = await db((prisma) =>
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, role: true, name: true, email: true, phone: true },
    })
  );

  if (existing) {
    const user = await db((prisma) =>
      prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name.trim() ? existing.name : params.name.trim() || existing.name,
          phone: existing.phone ?? phone,
        },
        select: { id: true, role: true, name: true, email: true },
      })
    );
    return { ok: true, user };
  }

  const user = await db((prisma) =>
    prisma.user.create({
      data: {
        name: params.name.trim() || email.split("@")[0] || "Пользователь",
        email,
        password: null,
        phone,
        role: "USER",
      },
      select: { id: true, role: true, name: true, email: true },
    })
  );

  return { ok: true, user };
}
