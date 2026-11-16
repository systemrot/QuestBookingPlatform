"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import {
  addFeedbackComment,
  deleteFeedback,
  deleteFeedbackComment,
  setFeedbackVote,
  submitFeedback,
} from "@/app/actions/feedback";
import type {
  FeedbackKindValue,
  FeedbackVoteValue,
} from "@/app/actions/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRu } from "@/lib/locale";
import { cn } from "@/lib/utils";

export type FeedbackCommentItem = {
  id: string;
  message: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

export type FeedbackListItem = {
  id: string;
  kind: FeedbackKindValue;
  message: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  likes: number;
  dislikes: number;
  score: number;
  myVote: FeedbackVoteValue | null;
  comments: FeedbackCommentItem[];
};

type Props = {
  currentUserId: string;
  canModerate: boolean;
  items: FeedbackListItem[];
};

const KIND_OPTIONS: { value: FeedbackKindValue; label: string }[] = [
  { value: "WISH", label: "Пожелание" },
  { value: "REVIEW", label: "Отзыв" },
  { value: "BUG", label: "Баг / проблема" },
  { value: "OTHER", label: "Другое" },
];

const KIND_LABEL: Record<FeedbackKindValue, string> = {
  WISH: "Пожелание",
  REVIEW: "Отзыв",
  BUG: "Баг",
  OTHER: "Другое",
};

export function FeedbackPanel({ currentUserId, canModerate, items }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<FeedbackKindValue>("WISH");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const refresh = () => router.refresh();

  const send = () => {
    startTransition(async () => {
      const res = await submitFeedback({ kind, message });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Идея добавлена");
      setMessage("");
      setKind("WISH");
      refresh();
    });
  };

  const vote = (feedbackId: string, value: FeedbackVoteValue) => {
    startTransition(async () => {
      const res = await setFeedbackVote({ feedbackId, value });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      refresh();
    });
  };

  const removeIdea = (item: FeedbackListItem) => {
    startTransition(async () => {
      const res = await deleteFeedback(item.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Идея удалена");
      refresh();
    });
  };

  const sendComment = (feedbackId: string) => {
    const text = (drafts[feedbackId] ?? "").trim();
    if (!text) {
      toast.error("Введите комментарий");
      return;
    }
    startTransition(async () => {
      const res = await addFeedbackComment({ feedbackId, message: text });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setDrafts((prev) => ({ ...prev, [feedbackId]: "" }));
      refresh();
    });
  };

  const removeComment = (commentId: string) => {
    startTransition(async () => {
      const res = await deleteFeedbackComment(commentId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      refresh();
    });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Новая идея</h2>
          <p className="text-sm text-muted-foreground">
            Пост увидит вся команда. Лайки и комментарии помогают понять, что
            важнее.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Тип</Label>
          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={kind === opt.value ? "default" : "outline"}
                disabled={pending}
                onClick={() => setKind(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="feedback-message">Текст</Label>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Опишите пожелание, отзыв или проблему…"
            rows={5}
            maxLength={2000}
            disabled={pending}
            className="min-h-28 resize-y"
          />
          <p className="text-xs text-muted-foreground">
            {message.trim().length}/2000
          </p>
        </div>

        <Button
          type="button"
          disabled={pending || message.trim().length < 3}
          onClick={send}
        >
          {pending ? "Сохраняем…" : "Опубликовать"}
        </Button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Доска идей</h2>
          <p className="text-sm text-muted-foreground">
            Сверху — идеи, которые команда поддержала сильнее всего.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока пусто.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="space-y-4 rounded-xl border border-border/70 px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{KIND_LABEL[item.kind]}</Badge>
                  <Badge variant="outline">
                    {item.score > 0 ? `+${item.score}` : item.score}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRu(new Date(item.createdAt), "d MMM yyyy, HH:mm")}
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {item.message}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={item.myVote === "LIKE" ? "default" : "outline"}
                    disabled={pending}
                    onClick={() => vote(item.id, "LIKE")}
                    aria-pressed={item.myVote === "LIKE"}
                  >
                    <ThumbsUp className="size-3.5" />
                    {item.likes}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.myVote === "DISLIKE" ? "default" : "outline"}
                    disabled={pending}
                    onClick={() => vote(item.id, "DISLIKE")}
                    aria-pressed={item.myVote === "DISLIKE"}
                  >
                    <ThumbsDown className="size-3.5" />
                    {item.dislikes}
                  </Button>
                  {canModerate ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      className="ml-auto"
                      onClick={() => removeIdea(item)}
                    >
                      Удалить идею
                    </Button>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground">
                  {item.authorName} · {item.authorEmail}
                  {item.authorRole === "OWNER" ? " · владелец" : null}
                  {item.authorRole === "ADMIN" ? " · админ" : null}
                </p>

                <div className="space-y-3 border-t border-border/60 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Комментарии
                  </p>
                  {item.comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Пока нет.</p>
                  ) : (
                    <ul className="space-y-3">
                      {item.comments.map((c) => {
                        const canDeleteComment =
                          canModerate || c.authorId === currentUserId;
                        return (
                          <li key={c.id} className="space-y-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-xs text-muted-foreground">
                                {c.authorName} ·{" "}
                                {formatRu(
                                  new Date(c.createdAt),
                                  "d MMM, HH:mm"
                                )}
                              </p>
                              {canDeleteComment ? (
                                <button
                                  type="button"
                                  disabled={pending}
                                  className={cn(
                                    "text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
                                  )}
                                  onClick={() => removeComment(c.id)}
                                >
                                  Удалить
                                </button>
                              ) : null}
                            </div>
                            <p className="whitespace-pre-wrap text-sm">
                              {c.message}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Textarea
                      value={drafts[item.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Короткий комментарий…"
                      rows={2}
                      maxLength={500}
                      disabled={pending}
                      className="min-h-16 flex-1 resize-y"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        pending || !(drafts[item.id] ?? "").trim().length
                      }
                      onClick={() => sendComment(item.id)}
                    >
                      Ответить
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
