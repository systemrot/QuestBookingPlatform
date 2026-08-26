import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { Yandex, type YandexProfile } from "@/auth/providers/yandex";
import { Vk, resolveVkEmail, type VkProfile } from "@/auth/providers/vk";
import { emailField, loginPasswordField } from "@/lib/field-limits";
import { upsertUserFromOAuth } from "@/lib/oauth-user";
import { db } from "@/lib/prisma";
import { resolveYandexEmail } from "@/lib/yandex-email";

const yandexConfigured =
  Boolean(process.env.AUTH_YANDEX_ID) && Boolean(process.env.AUTH_YANDEX_SECRET);
const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET);
const vkConfigured =
  Boolean(process.env.AUTH_VK_ID) && Boolean(process.env.AUTH_VK_SECRET);

const OAUTH_PROVIDERS = new Set(["yandex", "google", "vk"]);

type AppRole = "USER" | "ADMIN";

function hasAppRole(role: unknown): role is AppRole {
  return role === "USER" || role === "ADMIN";
}

function resolveOAuthEmail(
  provider: string,
  user: { email?: string | null },
  profile?: unknown
): string | null {
  if (provider === "yandex") {
    return resolveYandexEmail(user, profile as YandexProfile | null);
  }
  if (provider === "vk") {
    return resolveVkEmail(user, profile as VkProfile | null);
  }
  return user.email?.trim().toLowerCase() || null;
}

function resolveOAuthName(
  provider: string,
  user: { name?: string | null; email?: string | null },
  profile?: unknown
): string {
  if (user.name?.trim()) return user.name.trim();

  if (provider === "yandex") {
    const p = profile as YandexProfile | undefined;
    return (
      p?.real_name?.trim() ||
      p?.display_name?.trim() ||
      p?.login ||
      user.email?.split("@")[0] ||
      "Пользователь"
    );
  }

  if (provider === "vk") {
    const p = profile as VkProfile | undefined;
    const fromVk = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
    if (fromVk) return fromVk;
  }

  return user.email?.split("@")[0] || "Пользователь";
}

function resolveOAuthPhone(provider: string, profile?: unknown): string | null {
  if (provider === "yandex") {
    const p = profile as YandexProfile | undefined;
    return p?.default_phone?.number ?? null;
  }
  return null;
}

async function linkOAuthAccount(
  provider: string,
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: AppRole;
  },
  profile?: unknown
): Promise<boolean> {
  const email = resolveOAuthEmail(provider, user, profile);
  if (!email) {
    console.error(`[auth/${provider}] no email in OAuth profile`);
    return false;
  }

  const result = await upsertUserFromOAuth({
    email,
    name: resolveOAuthName(provider, user, profile),
    phoneRaw: resolveOAuthPhone(provider, profile),
  });

  if (!result.ok) {
    console.error(`[auth/${provider}] upsert denied:`, result.reason);
    return false;
  }

  user.id = result.user.id;
  user.role = result.user.role;
  user.name = result.user.name;
  user.email = result.user.email;
  return true;
}

async function hydrateTokenFromDb(token: {
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
    const existing = await db((prisma) =>
      prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, role: true, name: true, email: true },
      })
    );
    if (!existing) return;
    token.id = existing.id;
    token.role = existing.role;
    token.email = existing.email;
    token.name = existing.name;
  } catch (error) {
    console.error("[auth] hydrateTokenFromDb error:", error);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return Boolean(user?.id);
      if (account?.provider && OAUTH_PROVIDERS.has(account.provider)) return true;
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider && OAUTH_PROVIDERS.has(account.provider)) {
        const draft = {
          id: user?.id,
          name: user?.name ?? null,
          email: user?.email ?? null,
          role: undefined as AppRole | undefined,
        };
        try {
          const linked = await linkOAuthAccount(account.provider, draft, profile);
          if (linked) {
            token.id = draft.id!;
            token.role = draft.role!;
            token.email = draft.email ?? token.email;
            token.name = draft.name ?? token.name;
          } else {
            console.error(`[auth/${account.provider}] jwt link failed`);
          }
        } catch (error) {
          console.error(`[auth/${account.provider}] jwt link error:`, error);
        }
      } else if (user) {
        token.id = user.id;
        if (hasAppRole((user as { role?: unknown }).role)) {
          token.role = (user as { role: AppRole }).role;
        }
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
      }

      await hydrateTokenFromDb(token);
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") session.user.id = token.id;
        if (hasAppRole(token.role)) session.user.role = token.role;
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
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    ...(vkConfigured
      ? [
          Vk({
            clientId: process.env.AUTH_VK_ID!,
            clientSecret: process.env.AUTH_VK_SECRET!,
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
