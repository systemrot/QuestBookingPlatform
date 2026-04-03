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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

  const loadThreads = async () => {
    const t = await getAdminThreads();
    setThreads((prev) => mergeThreads(prev, t));
    if (!activeUserId && t.length > 0) setActiveUserId(t[0].userId);
  };

  const loadConversation = async (userId: string, showLoader = false) => {
    const requestId = ++requestIdRef.current;
    if (showLoader) {
      setConversation([]);
      setConversationLoading(true);
    }
    const rows = await getAdminConversation(userId);
    if (requestId !== requestIdRef.current) return;
    setConversation(rows);
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
    const id = setInterval(() => void tick(), 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [initialUserId, selectedFromUrl, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    pollingUserIdRef.current = activeUserId;
    const timer = setTimeout(() => {
      void loadConversation(activeUserId, true);
    }, 0);

    const tick = async () => {
      const currentUserId = pollingUserIdRef.current;
      if (!currentUserId) return;
      await loadConversation(currentUserId, false);
    };
    const id = setInterval(() => void tick(), 3000);
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

  const onSend = async () => {
    if (!activeUserId || !text.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(activeUserId, text);
    if ("error" in result && result.error) {
      toast.error(result.error);
      setSending(false);
      return;
    }
    setText("");
    forceScrollBottomRef.current = true;
    await loadConversation(activeUserId, false);
    await loadThreads();
    setSending(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[30%_70%]">
      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle>Диалоги</CardTitle>
          <CardDescription>Пользователи и последние сообщения.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh] px-4 pb-4">
            <div className="space-y-2 pt-1">
              {threads.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">Пока нет сообщений.</p>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.userId}
                    className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
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
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle>Чат: {activeUserName}</CardTitle>
          <CardDescription>
            {isPendingSwitch ? "Переключаем диалог..." : "Отвечайте пользователю в режиме реального времени."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div ref={messagesScrollRootRef}>
            <ScrollArea className="h-[62vh] rounded-md border border-border/70 p-2">
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
                <div className="space-y-2">
                  {conversation.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                        m.fromAdmin
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "mr-auto bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <div>{m.text}</div>
                      <div className="mt-1 text-[11px] opacity-80">{formatRu(new Date(m.createdAt), "d MMM, HH:mm")}</div>
                    </div>
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
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите сообщение..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <Button onClick={onSend} disabled={!activeUserId || !text.trim() || sending}>
              {sending ? "..." : "Отправить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

