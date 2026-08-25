import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { Yandex, type YandexProfile } from "@/auth/providers/yandex";
import { emailField, loginPasswordField } from "@/lib/field-limits";
import { upsertUserFromOAuth } from "@/lib/oauth-user";
import { db } from "@/lib/prisma";
import { resolveYandexEmail } from "@/lib/yandex-email";

const yandexConfigured =
  Boolean(process.env.AUTH_YANDEX_ID) && Boolean(process.env.AUTH_YANDEX_SECRET);

type AppRole = "USER" | "ADMIN";

function hasAppRole(role: unknown): role is AppRole {
  return role === "USER" || role === "ADMIN";
}

/** Подтягивает/создаёт пользователя в БД и пишет id+role в token. */
async function ensureTokenUser(token: {
  id?: unknown;
  role?: unknown;
  email?: unknown;
  name?: unknown;
}) {
  if (typeof token.id === "string" && token.id.length > 0 && hasAppRole(token.role)) {
    return;
  }

  const email =
    typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
  if (!email) return;

  try {
    const result = await upsertUserFromOAuth({
      email,
      name:
        (typeof token.name === "string" && token.name.trim()) ||
        email.split("@")[0] ||
        "Пользователь",
    });
    if (!result.ok) return;
    token.id = result.user.id;
    token.role = result.user.role;
    token.email = result.user.email;
    token.name = result.user.name;
  } catch (error) {
    console.error("[auth] ensureTokenUser error:", error);
  }
}

async function linkYandexAccount(
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: AppRole;
  },
  profile?: YandexProfile | null
): Promise<boolean> {
  const email = resolveYandexEmail(user, profile);
  if (!email) {
    console.error("[auth/yandex] no email in OAuth profile");
    return false;
  }

  const result = await upsertUserFromOAuth({
    email,
    name:
      user.name?.trim() ||
      profile?.real_name?.trim() ||
      profile?.display_name?.trim() ||
      profile?.login ||
      email,
    phoneRaw: profile?.default_phone?.number ?? null,
  });

  if (!result.ok) {
    console.error("[auth/yandex] upsert denied:", result.reason);
    return false;
  }

  user.id = result.user.id;
  user.role = result.user.role;
  user.name = result.user.name;
  user.email = result.user.email;
  return true;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return Boolean(user?.id);
      if (account?.provider === "yandex") return true;
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "yandex") {
        const yandexProfile = profile as YandexProfile | undefined;
        const draft = {
          id: user?.id,
          name: user?.name ?? null,
          email: user?.email ?? null,
          role: undefined as AppRole | undefined,
        };
        try {
          const linked = await linkYandexAccount(draft, yandexProfile);
          if (linked) {
            token.id = draft.id!;
            token.role = draft.role!;
            token.email = draft.email ?? token.email;
            token.name = draft.name ?? token.name;
          } else {
            console.error("[auth/yandex] jwt link failed");
            const email = resolveYandexEmail(draft, yandexProfile);
            if (email) token.email = email;
          }
        } catch (error) {
          console.error("[auth/yandex] jwt link error:", error);
        }
      } else if (user) {
        token.id = user.id;
        if (hasAppRole((user as { role?: unknown }).role)) {
          token.role = (user as { role: AppRole }).role;
        }
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
      }

      await ensureTokenUser(token);
      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      // Старые JWT после Яндекса могли остаться без id/role — чиним на каждом запросе.
      await ensureTokenUser(token);

      if (typeof token.id === "string" && token.id.length > 0) {
        session.user.id = token.id;
      }
      if (hasAppRole(token.role)) {
        session.user.role = token.role;
      }
      if (typeof token.email === "string") {
        session.user.email = token.email;
      }
      if (typeof token.name === "string") {
        session.user.name = token.name;
      }

      return session;
    },
  },
  providers: [
    ...(yandexConfigured
      ? [
          Yandex({
            clientId: process.env.AUTH_YANDEX_ID!,
            clientSecret: process.env.AUTH_YANDEX_SECRET!,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({
            email: emailField,
            password: loginPasswordField,
          })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db((prisma) =>
          prisma.user.findUnique({
            where: { email: parsed.data.email },
          })
        );
        if (!user?.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
