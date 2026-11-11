"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteActor, upsertActor } from "@/app/actions/owner";
import { CitySelectField } from "@/components/admin/city-select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ActorEditorCity = { id: string; name: string };
export type ActorEditorRow = {
  id: string;
  name: string;
  hourlyRate: string;
  cityId: string;
  cityName: string;
};

type Props = {
  cities: ActorEditorCity[];
  actors: ActorEditorRow[];
};

const emptyForm = {
  id: "" as string,
  name: "",
  hourlyRate: "",
  cityId: "",
};

export function ActorsManager({ cities, actors }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    ...emptyForm,
    cityId: cities[0]?.id ?? "",
  });
  const editing = Boolean(form.id);

  const reset = () =>
    setForm({ ...emptyForm, cityId: cities[0]?.id ?? "" });

  const startEdit = (a: ActorEditorRow) => {
    setForm({
      id: a.id,
      name: a.name,
      hourlyRate: a.hourlyRate,
      cityId: a.cityId,
    });
  };

  const save = () => {
    startTransition(async () => {
      const res = await upsertActor({
        id: form.id || undefined,
        name: form.name,
        hourlyRate: form.hourlyRate,
        cityId: form.cityId,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Актёр обновлён" : "Актёр создан");
      reset();
      router.refresh();
    });
  };

  const remove = (id: string, name: string) => {
    if (!window.confirm(`Удалить актёра «${name}»?`)) return;
    startTransition(async () => {
      const res = await deleteActor(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Актёр удалён");
      if (form.id === id) reset();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)]">
      <div className="space-y-3">
        {actors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Актёров пока нет.</p>
        ) : (
          <ul className="space-y-2">
            {actors.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-xl border border-border/70 bg-card/40 p-3",
                  form.id === a.id && "ring-1 ring-primary/40"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium leading-snug">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.cityName} · ставка {a.hourlyRate} ₽
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={pending}
                      onClick={() => startEdit(a)}
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive"
                      disabled={pending}
                      onClick={() => remove(a.id, a.name)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="space-y-3 rounded-xl border border-border/70 bg-card/40 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <p className="text-sm font-medium">
          {editing ? "Редактирование актёра" : "Новый актёр"}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="actor-name">Имя</Label>
          <Input
            id="actor-name"
            value={form.name}
            maxLength={80}
            disabled={pending}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="actor-city">Город</Label>
          <CitySelectField
            id="actor-city"
            cities={cities}
            value={form.cityId}
            disabled={pending}
            onChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="actor-rate">Ставка, ₽</Label>
          <Input
            id="actor-rate"
            inputMode="decimal"
            value={form.hourlyRate}
            disabled={pending}
            onChange={(e) =>
              setForm((f) => ({ ...f, hourlyRate: e.target.value }))
            }
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-8" disabled={pending}>
            {pending ? "Сохранение…" : editing ? "Сохранить" : "Создать"}
          </Button>
          {editing ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8"
              disabled={pending}
              onClick={reset}
            >
              Отмена
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
