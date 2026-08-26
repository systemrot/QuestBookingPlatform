"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOTE_MAX = 1000;
/** Примерно 2–3 строки; дальше — «Показать ещё». */
const PREVIEW_CHARS = 160;

type Props = {
  bookingId: string;
  initialNote: string;
};

export function BookingNoteEditor({ bookingId, initialNote }: Props) {
  const [value, setValue] = useState(initialNote);
  const [saved, setSaved] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setValue(initialNote);
    setSaved(initialNote);
    setEditing(false);
    setExpanded(false);
  }, [initialNote, bookingId]);

  const dirty = value !== saved;
  const needsExpand = saved.length > PREVIEW_CHARS;
  const preview =
    expanded || !needsExpand
      ? saved
      : `${saved.slice(0, PREVIEW_CHARS).trimEnd()}…`;

  const startEdit = () => {
    setValue(saved);
    setEditing(true);
  };

  const cancelEdit = () => {
    setValue(saved);
    setEditing(false);
  };

  const save = async () => {
    if (!dirty || saving) return;
    const next = value.trim();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/booking-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, note: next }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string; note?: string }
        | null;
      if (!res.ok || data?.error) {
        toast.error(data?.error ?? "Не удалось сохранить заметку.");
        return;
      }
      const stored = data?.note ?? next;
      setSaved(stored);
      setValue(stored);
      setEditing(false);
      setExpanded(false);
      toast.success(stored ? "Заметка сохранена" : "Заметка очищена");
    } catch {
      toast.error("Не удалось сохранить заметку.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        {saved ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {preview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Комментария нет</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {needsExpand ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Свернуть" : "Показать ещё"}
            </button>
          ) : null}
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            onClick={startEdit}
          >
            {saved ? "Изменить" : "Добавить"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        maxLength={NOTE_MAX}
        disabled={saving}
        rows={4}
        autoFocus
        placeholder="Заметки или пожелания к этой броне…"
        aria-label="Комментарий к брони"
        onChange={(e) => setValue(e.target.value)}
        className={cn(
          "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:opacity-50 dark:bg-input/30"
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {value.length}/{NOTE_MAX}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            disabled={saving}
            onClick={cancelEdit}
          >
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
