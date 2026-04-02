"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = { error?: string };

function safeCallbackUrl(url: string) {
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));

  if (!email || !password) {
    return { error: "Введите email и пароль." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Неверный email или пароль." };
      }
      return { error: "Сейчас не удалось выполнить вход. Попробуйте позже." };
    }
    throw error;
  }

  // On success, signIn redirects before reaching this line.
  return {};
}
