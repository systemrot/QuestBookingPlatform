"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1, "Укажите имя").max(120),
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
  phone: z.string().max(40, "Телефон слишком длинный").optional(),
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

  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    phone: phoneRaw === "" ? undefined : phoneRaw,
    age,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Аккаунт с таким email уже существует." };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
      phone: parsed.data.phone ?? null,
      age: parsed.data.age ?? null,
      role: "USER",
    },
  });

  return { success: true };
}
