"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  getAdminConversation,
  getAdminThreads,
  sendMessage,
  type AdminThread,
  type ChatMessageDto,
} from "@/app/actions/chat";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { clampChatMessageInput, FIELD_LIMITS } from "@/lib/field-limits";
import { formatRu } from "@/lib/locale";

type Props = {
  initialUserId?: string | null;
};

export function MessagesAdminPanel({ initialUserId = null }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFromUrl = searchParams.get("userId");
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(initialUserId);
  const [conversation, setConversation] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [isPendingSwitch, startSwitchTransition] = useTransition();
  const messagesScrollRootRef = useRef<HTMLDivElement | null>(null);
  const prevConversationIdsRef = useRef<string>("");
  const inputFocusedRef = useRef(false);
  const forceScrollBottomRef = useRef(false);
  const requestIdRef = useRef(0);
  const pollingUserIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);

  const scrollMessagesToBottom = () => {
    const viewport = messagesScrollRootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "auto" });
  };

  const mergeThreads = (prev: AdminThread[], next: AdminThread[]) => {
    const prevById = new Map(prev.map((row) => [row.userId, row]));
    let changed = prev.length !== next.length;
    const merged = next.map((row) => {
      const old = prevById.get(row.userId);
      if (
        old &&
        old.userName === row.userName &&
        old.lastText === row.lastText &&
        old.lastAt === row.lastAt &&
        old.unreadCount === row.unreadCount
      ) {
        return old;
      }
      changed = true;
      return row;
    });
    return changed ? merged : prev;
  };

  /** Keep optimistic bubbles; never flash-duplicate server rows. */
  const mergeConversation = (prev: ChatMessageDto[], server: ChatMessageDto[]) => {
    const byId = new Map(server.map((m) => [m.id, m]));
    const pending = prev.filter((m) => m.id.startsWith("pending-"));
    for (const p of pending) {
      const already =
        server.some(
          (s) =>
            s.fromAdmin === p.fromAdmin &&
            s.text === p.text &&
            Math.abs(+new Date(s.createdAt) - +new Date(p.createdAt)) < 60_000
        ) || byId.has(p.id);
      if (!already) byId.set(p.id, p);
    }
    return [...byId.values()].sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
    );
  };

  const loadThreads = async () => {
    const t = await getAdminThreads();
    setThreads((prev) => mergeThreads(prev, t));
    if (!activeUserId && t.length > 0) setActiveUserId(t[0].userId);
  };

  const loadConversation = async (
    userId: string,
    showLoader = false,
    markRead = false
  ) => {
    if (sendingRef.current && !showLoader) return;
    const requestId = ++requestIdRef.current;
    if (showLoader) {
      setConversation([]);
      setConversationLoading(true);
    }
    const rows = await getAdminConversation(userId, { markRead });
    if (requestId !== requestIdRef.current) return;
    setConversation((prev) =>
      showLoader ? rows : mergeConversation(prev, rows)
    );
    setConversationLoading(false);
  };

  useEffect(() => {
    if (selectedFromUrl && selectedFromUrl !== activeUserId) {
      const syncTimer = setTimeout(() => {
        setActiveUserId(selectedFromUrl);
      }, 0);
      return () => clearTimeout(syncTimer);
    }

    const tick = async () => {
      const t = await getAdminThreads();
      setThreads((prev) => mergeThreads(prev, t));
      setActiveUserId((prev) => prev ?? initialUserId ?? t[0]?.userId ?? null);
    };
    const timer = setTimeout(() => void tick(), 0);
    const id = setInterval(() => void tick(), 20_000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [initialUserId, selectedFromUrl, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    pollingUserIdRef.current = activeUserId;
    const timer = setTimeout(() => {
      void loadConversation(activeUserId, true, true);
    }, 0);

    const tick = async () => {
      const currentUserId = pollingUserIdRef.current;
      if (!currentUserId || sendingRef.current) return;
      await loadConversation(currentUserId, false, false);
    };
    const id = setInterval(() => void tick(), 20_000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
      pollingUserIdRef.current = null;
      requestIdRef.current += 1;
    };
  }, [activeUserId]);

  useEffect(() => {
    prevConversationIdsRef.current = "";
  }, [activeUserId]);

  useEffect(() => {
    if (conversationLoading || !activeUserId) return;

    const ids = conversation.map((m) => m.id).join(",");

    if (forceScrollBottomRef.current) {
      forceScrollBottomRef.current = false;
      prevConversationIdsRef.current = ids;
      requestAnimationFrame(() => scrollMessagesToBottom());
      return;
    }

    if (ids === prevConversationIdsRef.current) return;
    prevConversationIdsRef.current = ids;

    if (inputFocusedRef.current) return;

    requestAnimationFrame(() => scrollMessagesToBottom());
  }, [conversation, conversationLoading, activeUserId]);

  const activeUserName = useMemo(
    () => threads.find((t) => t.userId === activeUserId)?.userName ?? "Выберите диалог",
    [threads, activeUserId],
  );

  const threadListContent = useMemo(
    () =>
      threads.length === 0 ? (
        <p className="p-2 text-sm text-muted-foreground">Пока нет сообщений.</p>
      ) : (
        threads.map((thread) => (
          <button
            key={thread.userId}
            className={`flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 text-left transition-colors ${
              activeUserId === thread.userId ? "border-primary bg-primary/10" : "border-border/60 hover:bg-accent/40"
            }`}
            onClick={() => {
              startSwitchTransition(() => {
                setConversation([]);
                setConversationLoading(true);
                setActiveUserId(thread.userId);
                router.replace(`/admin/messages?userId=${thread.userId}`, { scroll: false });
              });
            }}
          >
            <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              {thread.userName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{thread.userName}</p>
                {thread.unreadCount > 0 ? (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" />
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">{thread.lastText}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatRu(new Date(thread.lastAt), "d MMMM, HH:mm")}</p>
            </div>
          </button>
        ))
      ),
    [threads, activeUserId, router, startSwitchTransition],
  );

  const onSend = async () => {
    if (!activeUserId || !text.trim() || sendingRef.current) return;

    const trimmed = text.trim();
    const tempId = `pending-${Date.now()}`;
    const optimistic: ChatMessageDto = {
      id: tempId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      fromAdmin: true,
    };

    sendingRef.current = true;
    setSending(true);
    setText("");
    setConversation((prev) => [...prev, optimistic]);
    forceScrollBottomRef.current = true;

    try {
      const result = await sendMessage(activeUserId, trimmed);
      if ("error" in result && result.error) {
        setConversation((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(result.error);
        return;
      }

      if ("message" in result && result.message) {
        const real = result.message;
        setConversation((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          if (withoutTemp.some((m) => m.id === real.id)) return withoutTemp;
          return [...withoutTemp, real].sort(
            (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
          );
        });
      }

      void loadThreads();
    } catch {
      setConversation((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Не удалось отправить сообщение.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,32%)_minmax(0,1fr)]">
      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle>Диалоги</CardTitle>
          <CardDescription>Пользователи и последние сообщения.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[min(40vh,320px)] overflow-y-auto overscroll-contain px-4 pb-4 lg:hidden">
            <div className="space-y-2 pt-1">{threadListContent}</div>
          </div>
          <ScrollArea className="hidden h-[min(70vh,640px)] px-4 pb-4 lg:block">
            <div className="space-y-2 pt-1">{threadListContent}</div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle className="truncate">Чат: {activeUserName}</CardTitle>
          <CardDescription>
            {isPendingSwitch ? "Переключаем диалог..." : "Отвечайте пользователю в режиме реального времени."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div ref={messagesScrollRootRef}>
            <ScrollArea className="h-[min(48vh,420px)] rounded-md border border-border/70 p-2 lg:h-[min(62vh,560px)]">
              {!activeUserId ? (
                <p className="p-2 text-sm text-muted-foreground">Выберите чат для начала общения</p>
              ) : conversationLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-14 w-2/3" />
                  <Skeleton className="ml-auto h-14 w-1/2" />
                  <Skeleton className="h-14 w-3/4" />
                  <Skeleton className="ml-auto h-14 w-2/5" />
                </div>
              ) : conversation.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">Пока нет сообщений в этом чате.</p>
              ) : (
                <div className="space-y-3 py-1">
                  {conversation.map((m) => (
                    <ChatMessageBubble
                      key={m.id}
                      text={m.text}
                      createdAt={m.createdAt}
                      variant={m.fromAdmin ? "outgoing" : "incoming"}
                      label={m.fromAdmin ? undefined : activeUserName}
                      pending={m.id.startsWith("pending-")}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="flex gap-2">
            <Input
              value={text}
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onBlur={() => {
                inputFocusedRef.current = false;
              }}
              maxLength={FIELD_LIMITS.chatMessage.max}
              onChange={(e) => setText(clampChatMessageInput(e.target.value))}
              placeholder="Введите сообщение..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <Button
              className="shrink-0"
              onClick={onSend}
              disabled={!activeUserId || !text.trim() || sending}
            >
              {sending ? "..." : "Отправить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

