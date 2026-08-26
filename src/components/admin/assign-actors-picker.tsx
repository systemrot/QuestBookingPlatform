"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActorOption = {
  id: string;
  name: string;
};

type AssignedActor = {
  id: string;
  name: string;
};

type Props = {
  slotId: string;
  actors: ActorOption[];
  assignedActors: AssignedActor[];
};

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function AssignActorsPicker({ slotId, actors, assignedActors }: Props) {
  const initialIds = useMemo(
    () => assignedActors.map((a) => a.id),
    [assignedActors]
  );
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [savedIds, setSavedIds] = useState(initialIds);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = !sameIds(selectedIds, savedIds);

  const selectedActors = useMemo(
    () =>
      selectedIds
        .map((id) => actors.find((a) => a.id === id))
        .filter((a): a is ActorOption => Boolean(a)),
    [actors, selectedIds]
  );

  const toggle = (actorId: string) => {
    if (saving) return;
    setSelectedIds((prev) =>
      prev.includes(actorId)
        ? prev.filter((id) => id !== actorId)
        : [...prev, actorId]
    );
  };

  const remove = (actorId: string) => {
    if (saving) return;
    setSelectedIds((prev) => prev.filter((id) => id !== actorId));
  };

  const discard = () => {
    setSelectedIds(savedIds);
    setOpen(false);
  };

  const save = async () => {
    if (!dirty || saving) return;
    const next = [...selectedIds];
    setSaving(true);
    try {
      // Обычный fetch — без server action, иначе Next после action сам
      // перезапрашивает RSC страницы и вкладка долго крутит «загрузку».
      const res = await fetch("/api/admin/slot-actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, actorIds: next }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;
      if (!res.ok || data?.error) {
        toast.error(
          data?.error ?? "Не удалось сохранить актёров. Попробуйте ещё раз."
        );
        return;
      }
      setSavedIds(next);
      setSelectedIds(next);
      setOpen(false);
      toast.success(
        next.length === 0
          ? "Актёры сняты"
          : next.length === 1
            ? "Актёр сохранён"
            : `Сохранено актёров: ${next.length}`
      );
    } catch {
      toast.error("Не удалось сохранить актёров. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-sm space-y-2">
      {selectedActors.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedActors.map((actor) => (
            <Badge
              key={actor.id}
              variant="secondary"
              className="h-auto max-w-full gap-1 overflow-visible py-0.5 pr-0.5"
            >
              <span className="truncate pl-0.5">{actor.name}</span>
              <button
                type="button"
                disabled={saving}
                aria-label={`Убрать ${actor.name}`}
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground disabled:opacity-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(actor.id);
                }}
              >
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Актёры не назначены</p>
      )}

      {actors.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Список актёров пуст — добавьте записи в таблицу Actor (seed) или через БД.
        </p>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between"
            disabled={saving}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span>{open ? "Скрыть список" : "Выбрать актёров"}</span>
            <span className="text-xs text-muted-foreground">
              {selectedIds.length}/{actors.length}
            </span>
          </Button>

          {open ? (
            <ul className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border border-border/70 bg-background/40 p-1">
              {actors.map((actor) => {
                const checked = selectedIds.includes(actor.id);
                return (
                  <li key={actor.id}>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => toggle(actor.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                        checked
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        )}
                        aria-hidden
                      >
                        {checked ? <Check className="size-3" /> : null}
                      </span>
                      <span className="min-w-0 truncate">{actor.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {dirty ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 flex-1"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                disabled={saving}
                onClick={discard}
              >
                Отмена
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
