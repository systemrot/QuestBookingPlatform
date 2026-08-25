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
          }
        } catch (error) {
          console.error("[auth/yandex] jwt link error:", error);
        }
      } else if (user) {
        token.id = user.id;
        token.role = (user as { role: "USER" | "ADMIN" }).role;
      }
      return token;
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
