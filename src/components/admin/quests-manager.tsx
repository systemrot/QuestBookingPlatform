"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteQuest, upsertQuest } from "@/app/actions/owner";
import { CitySelectField } from "@/components/admin/city-select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type QuestEditorCity = { id: string; name: string };
export type QuestEditorRow = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  price: string;
  cityId: string;
  cityName: string;
};

type Props = {
  cities: QuestEditorCity[];
  quests: QuestEditorRow[];
};

const emptyForm = {
  id: "" as string,
  title: "",
  description: "",
  image: "",
  price: "",
  cityId: "",
};

export function QuestsManager({ cities, quests }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    ...emptyForm,
    cityId: cities[0]?.id ?? "",
  });
  const editing = Boolean(form.id);

  const reset = () =>
    setForm({ ...emptyForm, cityId: cities[0]?.id ?? "" });

  const startEdit = (q: QuestEditorRow) => {
    setForm({
      id: q.id,
      title: q.title,
      description: q.description ?? "",
      image: q.image ?? "",
      price: q.price,
      cityId: q.cityId,
    });
  };

  const save = () => {
    startTransition(async () => {
      const res = await upsertQuest({
        id: form.id || undefined,
        title: form.title,
        description: form.description,
        image: form.image,
        price: form.price,
        cityId: form.cityId,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Квест обновлён" : "Квест создан");
      reset();
      router.refresh();
    });
  };

  const remove = (id: string, title: string) => {
    if (!window.confirm(`Удалить квест «${title}»? Слоты тоже удалятся.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteQuest(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Квест удалён");
      if (form.id === id) reset();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)]">
      <div className="space-y-3">
        {quests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Квестов пока нет.</p>
        ) : (
          <ul className="space-y-2">
            {quests.map((q) => (
              <li
                key={q.id}
                className={cn(
                  "rounded-xl border border-border/70 bg-card/40 p-3",
                  form.id === q.id && "ring-1 ring-primary/40"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium leading-snug">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.cityName} · {q.price} ₽
                      {q.image ? ` · ${q.image}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={pending}
                      onClick={() => startEdit(q)}
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive"
                      disabled={pending}
                      onClick={() => remove(q.id, q.title)}
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
          {editing ? "Редактирование квеста" : "Новый квест"}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="quest-title">Название</Label>
          <Input
            id="quest-title"
            value={form.title}
            maxLength={120}
            disabled={pending}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quest-city">Город</Label>
          <CitySelectField
            id="quest-city"
            cities={cities}
            value={form.cityId}
            disabled={pending}
            onChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quest-price">Цена, ₽</Label>
          <Input
            id="quest-price"
            inputMode="decimal"
            value={form.price}
            disabled={pending}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quest-image">Фото (путь или URL)</Label>
          <Input
            id="quest-image"
            value={form.image}
            placeholder="/Kluch.jpg"
            disabled={pending}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quest-desc">Описание</Label>
          <textarea
            id="quest-desc"
            rows={5}
            value={form.description}
            disabled={pending}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
