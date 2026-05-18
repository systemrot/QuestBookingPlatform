"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { nameField } from "@/lib/field-limits";
import { prisma } from "@/lib/prisma";
import { parseOptionalRuPhone } from "@/lib/ru-phone";

const profileSchema = z.object({
  name: nameField,
  phone: z.string().optional(),
  age: z
    .number()
    .int("Возраст должен быть целым числом")
    .min(1, "Возраст должен быть больше 0")
    .max(120, "Возраст должен быть не больше 120")
    .optional(),
});

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfileAction(
  _prev: UpdateProfileState | undefined,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Необходимо войти в аккаунт." };
  }

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

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: phoneParsed.value ?? undefined,
    age,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      age: parsed.data.age ?? null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

