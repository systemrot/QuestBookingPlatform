"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Info, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteQuest, upsertQuest } from "@/app/actions/owner";
import { CitySelectField } from "@/components/admin/city-select-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveQuestImage } from "@/lib/quest-image";
import {
  IMAGE_ALT_MAX,
  QUEST_IMAGE_ALT_HINT,
} from "@/lib/quest-image-alt";
import { cn } from "@/lib/utils";

export type QuestEditorCity = { id: string; name: string };
export type QuestEditorRow = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  price: string;
  cityId: string;
  cityName: string;
};

type Props = {
  cities: QuestEditorCity[];
  quests: QuestEditorRow[];
};

type FormState = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  price: string;
  cityId: string;
};

function emptyForm(cities: QuestEditorCity[]): FormState {
  return {
    id: "",
    title: "",
    description: "",
    image: "",
    imageAlt: "",
    price: "",
    cityId: cities[0]?.id ?? "",
  };
}

function CoverThumb({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const resolved = resolveQuestImage(src);
  if (!resolved) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-muted/60 text-[10px] text-muted-foreground",
          className
        )}
      >
        нет фото
      </div>
    );
  }
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-lg bg-muted/40", className)}>
      <Image
        src={resolved}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        sizes="96px"
      />
    </div>
  );
}

export function QuestsManager({ cities, quests }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(cities));
  const editing = Boolean(form.id);

  const previewSrc = useMemo(
    () => resolveQuestImage(form.image.trim() || null),
    [form.image]
  );

  const closeDialog = () => {
    setOpen(false);
    setForm(emptyForm(cities));
  };

  const openCreate = () => {
    setForm(emptyForm(cities));
    setOpen(true);
  };

  const openEdit = (q: QuestEditorRow) => {
    setForm({
      id: q.id,
      title: q.title,
      description: q.description ?? "",
      image: q.image ?? "",
      imageAlt: q.imageAlt ?? "",
      price: q.price,
      cityId: q.cityId,
    });
    setOpen(true);
  };

  const save = () => {
    startTransition(async () => {
      const res = await upsertQuest({
        id: form.id || undefined,
        title: form.title,
        description: form.description,
        image: form.image,
        imageAlt: form.imageAlt,
        price: form.price,
        cityId: form.cityId,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Квест обновлён" : "Квест создан");
      closeDialog();
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
      if (form.id === id) closeDialog();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {quests.length === 0
            ? "Квестов пока нет"
            : `Всего: ${quests.length}`}
        </p>
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5"
          disabled={pending}
          onClick={openCreate}
        >
          <Plus className="size-3.5" aria-hidden />
          Новый квест
        </Button>
      </div>

      {quests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-card/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Создайте первый сценарий кнопкой выше.
        </p>
      ) : (
        <ul className="space-y-2">
          {quests.map((q) => (
            <li
              key={q.id}
              className="rounded-xl border border-border/70 bg-card/40 p-3"
            >
              <div className="flex items-start gap-3">
                <CoverThumb
                  src={q.image}
                  alt={q.imageAlt?.trim() || q.title}
                  className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium leading-snug">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.cityName} · {q.price} ₽
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={pending}
                      onClick={() => openEdit(q)}
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
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !pending) closeDialog();
        }}
      >
        <DialogContent
          showCloseButton={!pending}
          className="sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактирование квеста" : "Новый квест"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Изменения сразу попадут в каталог выбранного города."
                : "Заполните поля и сохраните — квест появится в каталоге."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="quest-title">Название</Label>
              <Input
                id="quest-title"
                value={form.title}
                maxLength={120}
                disabled={pending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quest-image">Фото (путь или URL)</Label>
              <div className="flex items-start gap-3">
                <CoverThumb
                  src={previewSrc}
                  alt={form.imageAlt.trim() || form.title || "Превью обложки"}
                  className="h-20 w-20"
                />
                <Input
                  id="quest-image"
                  value={form.image}
                  placeholder="/brand/covers/dyshi-v5.jpg"
                  disabled={pending}
                  className="min-w-0 flex-1"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="quest-image-alt">Alt обложки</Label>
                <span className="relative inline-flex group">
                  <button
                    type="button"
                    className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    aria-label="Подсказка по alt обложки"
                  >
                    <Info className="size-3.5" aria-hidden />
                  </button>
                  <span
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-1/2 z-20 w-56 -translate-x-1/2",
                      "rounded-md border border-border/70 bg-popover px-2.5 py-2 text-[11px] leading-snug text-popover-foreground shadow-md",
                      "opacity-0 transition-opacity duration-100",
                      "group-hover:opacity-100 group-focus-within:opacity-100"
                    )}
                  >
                    {QUEST_IMAGE_ALT_HINT}
                  </span>
                </span>
              </div>
              <Input
                id="quest-image-alt"
                value={form.imageAlt}
                maxLength={IMAGE_ALT_MAX}
                placeholder="Не дыши — тёмная фабрика"
                disabled={pending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageAlt: e.target.value }))
                }
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

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                disabled={pending}
                onClick={closeDialog}
              >
                Отмена
              </Button>
              <Button type="submit" size="sm" className="h-8" disabled={pending}>
                {pending
                  ? "Сохранение…"
                  : editing
                    ? "Сохранить"
                    : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
