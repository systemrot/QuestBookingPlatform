"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export type ViewerSession = {
  role: "USER" | "ADMIN";
  name?: string | null;
  email?: string | null;
};

/** Актуальная сессия с сервера — для client-компонентов после OAuth / client navigation. */
export async function getViewerSession(): Promise<ViewerSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  let role: "USER" | "ADMIN" | undefined = session.user.role;
  if (!role) {
    const dbUser = await db((prisma) =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );
    role = dbUser?.role;
  }

  if (!role) return null;

  return {
    role,
    name: session.user.name,
    email: session.user.email,
  };
}
