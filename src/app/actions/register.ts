"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { emailField, nameField, passwordField } from "@/lib/field-limits";
import { db } from "@/lib/prisma";
import { parseOptionalRuPhone } from "@/lib/ru-phone";

const schema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  phone: z.string().optional(),
  age: z
    .number()
    .int("Возраст должен быть целым числом")
    .min(1, "Возраст должен быть больше 0")
    .max(120, "Возраст должен быть не больше 120")
    .optional(),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function registerUser(
  _prev: RegisterState | undefined,
  formData: FormData
): Promise<RegisterState> {
  const ageRaw = String(formData.get("age") ?? "").trim();
  let age: number | undefined;
  if (ageRaw !== "") {
    const n = Number(ageRaw);
    if (Number.isNaN(n)) {
      return { fieldErrors: { age: ["Возраст должен быть числом"] } };
    }
    age = n;
  }

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phoneParsed = parseOptionalRuPhone(phoneRaw);
  if (!phoneParsed.ok) {
    return { fieldErrors: { phone: [phoneParsed.message] } };
  }

  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    phone: phoneParsed.value ?? undefined,
    age,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db((prisma) =>
    prisma.user.findUnique({
      where: { email: parsed.data.email },
    })
  );
  if (existing) {
    return { error: "Аккаунт с таким email уже существует." };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  await db((prisma) =>
    prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashed,
        phone: parsed.data.phone ?? null,
        age: parsed.data.age ?? null,
        role: "USER",
      },
    })
  );

  return { success: true };
}
