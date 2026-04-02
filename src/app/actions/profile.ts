"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(1, "Укажите имя").max(120),
  phone: z.string().max(40, "Телефон слишком длинный").optional(),
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

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: phoneRaw === "" ? undefined : phoneRaw,
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

