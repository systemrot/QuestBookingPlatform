"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/auth";
import { emailField, loginPasswordField, safeCallbackUrl } from "@/lib/field-limits";

export type LoginState = { error?: string; fieldErrors?: Record<string, string[]> };

const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

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
