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

const DB_USER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** OAuth profile() отдаёт id Яндекса (число), не uuid из нашей БД — без этого role/id в JWT ломаются. */
async function reconcileTokenWithDb(token: {
  id?: unknown;
  role?: unknown;
  email?: unknown;
}) {
  const hasDbIdentity =
    typeof token.id === "string" &&
    DB_USER_ID_RE.test(token.id) &&
    (token.role === "USER" || token.role === "ADMIN");

  if (hasDbIdentity) return;

  const email =
    typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
  if (!email) return;

  try {
    const dbUser = await db((prisma) =>
      prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, role: true },
      })
    );
    if (!dbUser) return;
    token.id = dbUser.id;
    token.role = dbUser.role;
  } catch (error) {
    console.error("[auth] reconcileTokenWithDb error:", error);
  }
}

async function linkYandexAccount(
  user: { id?: string; name?: string | null; email?: string | null; role?: "USER" | "ADMIN" },
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
          role: undefined as "USER" | "ADMIN" | undefined,
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
        token.role = (user as { role: "USER" | "ADMIN" }).role;
        if (user.email) token.email = user.email;
      }

      await reconcileTokenWithDb(token);

      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      const email = (
        session.user.email ??
        (typeof token.email === "string" ? token.email : null)
      )
        ?.trim()
        .toLowerCase();

      if (email) {
        try {
          const dbUser = await db((prisma) =>
            prisma.user.findFirst({
              where: { email: { equals: email, mode: "insensitive" } },
              select: { id: true, role: true, name: true, email: true },
            })
          );
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.name = session.user.name ?? dbUser.name;
            session.user.email = dbUser.email;
            return session;
          }
        } catch (error) {
          console.error("[auth] session db lookup error:", error);
        }
      }

      session.user.id = token.id as string;
      session.user.role = token.role as "USER" | "ADMIN";
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
