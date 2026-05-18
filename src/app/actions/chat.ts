"use server";

import { auth } from "@/auth";
import { parseChatMessage } from "@/lib/field-limits";
import { prisma } from "@/lib/prisma";

type SessionLike = { user?: { id?: string; role?: string } } | null;

function ensureUser(session: SessionLike) {
  if (!session?.user?.id || session.user.role !== "USER") {
    throw new Error("Недостаточно прав");
  }
}

function ensureAdmin(session: SessionLike) {
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }
}

export type ChatMessageDto = {
  id: string;
  text: string;
  createdAt: string;
  fromAdmin: boolean;
};

export type UnreadNotification = {
  id: string;
  userId: string;
  userName: string;
  textSnippet: string;
};

async function resolveAdminId() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

export async function getUserChatMessages(): Promise<{ messages: ChatMessageDto[]; error?: string }> {
  const session = await auth();
  ensureUser(session);
  const userId = session?.user?.id;
  if (!userId) throw new Error("Недостаточно прав");

  const adminId = await resolveAdminId();
  if (!adminId) return { messages: [], error: "Администратор пока недоступен." };

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: adminId },
        { senderId: adminId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
      fromAdmin: m.senderId === adminId,
    })),
  };
}

export async function sendUserChatMessage(text: string) {
  const session = await auth();
  ensureUser(session);
  const userId = session?.user?.id;
  if (!userId) throw new Error("Недостаточно прав");

  const adminId = await resolveAdminId();
  if (!adminId) return { error: "Администратор пока недоступен." };

  const parsed = parseChatMessage(text);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректное сообщение." };
  }

  await prisma.chatMessage.create({
    data: {
      senderId: userId,
      receiverId: adminId,
      text: parsed.data,
      isRead: false,
    },
  });

  return { success: true as const };
}

export type AdminThread = {
  userId: string;
  userName: string;
  lastText: string;
  lastAt: string;
  unreadCount: number;
};

export async function getAdminThreads(): Promise<AdminThread[]> {
  const session = await auth();
  ensureAdmin(session);
  const adminId = session?.user?.id;
  if (!adminId) throw new Error("Недостаточно прав");

  const rows = await prisma.chatMessage.findMany({
    where: {
      OR: [{ senderId: adminId }, { receiverId: adminId }],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const map = new Map<string, AdminThread>();
  for (const row of rows) {
    const other = row.senderId === adminId ? row.receiver : row.sender;
    if (!other || other.role !== "USER") continue;
    if (!map.has(other.id)) {
      map.set(other.id, {
        userId: other.id,
        userName: other.name,
        lastText: row.text,
        lastAt: row.createdAt.toISOString(),
        unreadCount: 0,
      });
    }
    if (row.senderId === other.id && row.receiverId === adminId && !row.isRead) {
      const current = map.get(other.id);
      if (current) {
        current.unreadCount += 1;
      }
    }
  }

  return Array.from(map.values());
}

export async function getAdminConversation(userId: string): Promise<ChatMessageDto[]> {
  const session = await auth();
  ensureAdmin(session);
  const adminId = session?.user?.id;
  if (!adminId) throw new Error("Недостаточно прав");

  await prisma.chatMessage.updateMany({
    where: {
      senderId: userId,
      receiverId: adminId,
      isRead: false,
    },
    data: { isRead: true },
  });

  const latest = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: adminId, receiverId: userId },
        { senderId: userId, receiverId: adminId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const messages = latest.reverse();

  return messages.map((m) => ({
    id: m.id,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    fromAdmin: m.senderId === adminId,
  }));
}

export async function getMessages(userId: string): Promise<ChatMessageDto[]> {
  return getAdminConversation(userId);
}

export async function sendAdminChatMessage(userId: string, text: string) {
  const session = await auth();
  ensureAdmin(session);
  const adminId = session?.user?.id;
  if (!adminId) throw new Error("Недостаточно прав");

  const parsed = parseChatMessage(text);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректное сообщение." };
  }

  await prisma.chatMessage.create({
    data: {
      senderId: adminId,
      receiverId: userId,
      text: parsed.data,
      isRead: false,
    },
  });

  return { success: true as const };
}

export async function sendMessage(userId: string, text: string) {
  return sendAdminChatMessage(userId, text);
}

export async function getUnreadCount() {
  const session = await auth();
  ensureAdmin(session);
  const adminId = session?.user?.id;
  if (!adminId) throw new Error("Недостаточно прав");

  const count = await prisma.chatMessage.count({
    where: {
      receiverId: adminId,
      isRead: false,
      sender: { role: "USER" },
    },
  });

  return { count };
}

export async function getUnreadNotifications(): Promise<UnreadNotification[]> {
  const session = await auth();
  ensureAdmin(session);
  const adminId = session?.user?.id;
  if (!adminId) throw new Error("Недостаточно прав");

  const rows = await prisma.chatMessage.findMany({
    where: {
      receiverId: adminId,
      isRead: false,
      sender: { role: "USER" },
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.senderId,
    userName: row.sender.name,
    textSnippet: row.text.slice(0, 80),
  }));
}

