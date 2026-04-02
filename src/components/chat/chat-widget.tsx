"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { getUserChatMessages, sendUserChatMessage, type ChatMessageDto } from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRu } from "@/lib/locale";

export function ChatWidget() {
  const [opened, setOpened] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const data = await getUserChatMessages();
      if (data.error) return;
      setMessages(data.messages);
    } catch {
      // Silent polling failure.
    }
  };

  useEffect(() => {
    if (!opened) return;
    const timer = setTimeout(() => {
      void load();
    }, 0);
    const id = setInterval(() => void load(), 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [opened]);

  const sorted = useMemo(
    () => [...messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [messages],
  );

  const onSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const result = await sendUserChatMessage(text);
    if ("error" in result && result.error) {
      toast.error(result.error);
      setSending(false);
      return;
    }
    setText("");
    await load();
    setSending(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {opened ? (
        <Card className="w-[340px] border-border/80 bg-card/95 shadow-2xl backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Поддержка</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpened(false)} aria-label="Закрыть чат">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-72 space-y-2 overflow-y-auto rounded-md border border-border/70 p-2">
              {sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground">Напишите первое сообщение в поддержку.</p>
              ) : (
                sorted.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                      m.fromAdmin
                        ? "mr-auto bg-secondary text-secondary-foreground"
                        : "ml-auto bg-primary text-primary-foreground"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className="mt-1 text-[11px] opacity-80">{formatRu(new Date(m.createdAt), "d MMM, HH:mm")}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onSend();
                  }
                }}
              />
              <Button onClick={onSend} disabled={sending || !text.trim()}>
                {sending ? "..." : "Отправить"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg" onClick={() => setOpened(true)} aria-label="Открыть чат">
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

