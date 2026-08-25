"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

import { getUserChatMessages, sendUserChatMessage, type ChatMessageDto } from "@/app/actions/chat";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { clampChatMessageInput, FIELD_LIMITS } from "@/lib/field-limits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const POLL_MS = 20_000;

function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="mr-auto max-w-[70%] space-y-1">
        <Skeleton className="h-12 w-44 rounded-2xl rounded-bl-md" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="ml-auto max-w-[70%] space-y-1">
        <Skeleton className="ml-auto h-10 w-36 rounded-2xl rounded-br-md" />
        <Skeleton className="ml-auto h-3 w-14" />
      </div>
      <div className="ml-auto max-w-[70%] space-y-1">
        <Skeleton className="ml-auto h-8 w-20 rounded-2xl rounded-br-md" />
        <Skeleton className="ml-auto h-3 w-14" />
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [opened, setOpened] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sendingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, []);

  const load = useCallback(async () => {
    if (sendingRef.current) return;
    try {
      const data = await getUserChatMessages();
      if (data.error) return;
      setMessages(data.messages);
    } catch {
      // Тихий сбой опроса — не мешаем вводу.
    } finally {
      setHasLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    if (!opened) return;
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [opened, load]);

  const sorted = useMemo(
    () => [...messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [messages]
  );

  useEffect(() => {
    if (!opened) return;
    requestAnimationFrame(() => scrollToBottom());
  }, [opened, sorted.length, pendingId, scrollToBottom]);

  const onSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const tempId = `pending-${Date.now()}`;
    const optimistic: ChatMessageDto = {
      id: tempId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      fromAdmin: false,
    };

    setSending(true);
    sendingRef.current = true;
    setPendingId(tempId);
    setMessages((prev) => [...prev, optimistic]);
    setText("");

    try {
      const result = await sendUserChatMessage(trimmed);
      if ("error" in result && result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(result.error);
        return;
      }

      if ("message" in result && result.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? result.message : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Не удалось отправить сообщение. Попробуйте ещё раз.");
    } finally {
      setPendingId(null);
      setSending(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
      {opened ? (
        <Card className="mb-2 flex max-h-[min(32rem,calc(100dvh-6rem))] w-[min(340px,calc(100vw-2rem))] flex-col border-border/80 bg-card/95 shadow-2xl backdrop-blur">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border/60 pb-3">
            <div>
              <CardTitle className="text-base">Поддержка</CardTitle>
              <p className="text-xs text-muted-foreground">Обычно отвечаем в рабочее время</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpened(false)}
              aria-label="Закрыть чат"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden pt-4">
            <div
              ref={viewportRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-border/60 bg-black/20 p-3"
              style={{ maxHeight: "18rem" }}
            >
              {!hasLoadedOnce ? (
                <ChatLoadingSkeleton />
              ) : sorted.length === 0 ? (
                <p className="m-auto max-w-[220px] text-center text-sm text-muted-foreground">
                  Напишите первое сообщение — мы ответим как можно скорее.
                </p>
              ) : (
                sorted.map((m) => (
                  <ChatMessageBubble
                    key={m.id}
                    text={m.text}
                    createdAt={m.createdAt}
                    variant={m.fromAdmin ? "incoming" : "outgoing"}
                    label={m.fromAdmin ? "Поддержка" : undefined}
                    pending={m.id === pendingId}
                  />
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={text}
                maxLength={FIELD_LIMITS.chatMessage.max}
                onChange={(e) => setText(clampChatMessageInput(e.target.value))}
                placeholder="Введите сообщение..."
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onSend();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={() => void onSend()}
                disabled={sending || !text.trim()}
                aria-label="Отправить"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpened(true)}
          aria-label="Открыть чат"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
