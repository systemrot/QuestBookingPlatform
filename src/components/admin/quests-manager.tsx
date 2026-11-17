"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GripVertical, Info, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  archiveQuest,
  deleteQuest,
  reorderQuests,
  restoreQuest,
  upsertQuest,
} from "@/app/actions/owner";
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
  sortOrder: number;
  archivedAt: string | null;
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

type ConfirmState =
  | { kind: "archive"; quest: QuestEditorRow }
  | { kind: "restore"; quest: QuestEditorRow }
  | { kind: "delete"; quest: QuestEditorRow };

type ListTab = string; // cityId | "archive"

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

function sortActive(rows: QuestEditorRow[]) {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru")
  );
}

function sortArchived(rows: QuestEditorRow[]) {
  return [...rows].sort((a, b) => {
    const at = a.archivedAt ?? "";
    const bt = b.archivedAt ?? "";
    return bt.localeCompare(at) || a.title.localeCompare(b.title, "ru");
  });
}

export function QuestsManager({ cities, quests }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(cities));
  const [tab, setTab] = useState<ListTab>(() => cities[0]?.id ?? "archive");
  const [localQuests, setLocalQuests] = useState(quests);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const blockDragRef = useRef(false);
  /** Touch/pen DnD — HTML5 drag не работает на мобилках. */
  const pointerDragRef = useRef<{
    id: string;
    pointerId: number;
    moved: boolean;
    overId: string | null;
  } | null>(null);
  const editing = Boolean(form.id);
  const archiveTab = tab === "archive";

  useEffect(() => {
    setLocalQuests(quests);
  }, [quests]);

  useEffect(() => {
    if (tab === "archive") return;
    if (!cities.some((c) => c.id === tab) && cities[0]) {
      setTab(cities[0].id);
    }
  }, [cities, tab]);

  const previewSrc = useMemo(
    () => resolveQuestImage(form.image.trim() || null),
    [form.image]
  );

  const activeQuests = useMemo(
    () => sortActive(localQuests.filter((q) => !q.archivedAt)),
    [localQuests]
  );
  const archivedQuests = useMemo(
    () => sortArchived(localQuests.filter((q) => Boolean(q.archivedAt))),
    [localQuests]
  );

  const cityQuests = useMemo(
    () => activeQuests.filter((q) => q.cityId === tab),
    [activeQuests, tab]
  );

  const visibleQuests = archiveTab ? archivedQuests : cityQuests;

  const closeDialog = () => {
    setOpen(false);
    setForm(emptyForm(cities));
  };

  const closeConfirm = () => {
    if (pending) return;
    setConfirm(null);
  };

  const openCreate = () => {
    const cityId =
      !archiveTab && tab ? tab : cities[0]?.id || "";
    setForm({
      ...emptyForm(cities),
      cityId,
    });
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

  const runConfirm = () => {
    if (!confirm) return;
    const { kind, quest } = confirm;

    startTransition(async () => {
      if (kind === "archive") {
        const res = await archiveQuest(quest.id);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`«${quest.title}» в архиве`);
        setConfirm(null);
        router.refresh();
        return;
      }

      if (kind === "restore") {
        const res = await restoreQuest(quest.id);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`«${quest.title}» снова в каталоге`);
        setConfirm(null);
        router.refresh();
        return;
      }

      const res = await deleteQuest(quest.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`«${quest.title}» удалён`);
      if (form.id === quest.id) closeDialog();
      setConfirm(null);
      router.refresh();
    });
  };

  const persistOrder = (cityId: string, ordered: QuestEditorRow[]) => {
    const previous = localQuests;
    const next = localQuests.map((q) => {
      if (q.cityId !== cityId || q.archivedAt) return q;
      const index = ordered.findIndex((row) => row.id === q.id);
      if (index < 0) return q;
      return { ...q, sortOrder: index };
    });
    setLocalQuests(next);

    startTransition(async () => {
      const res = await reorderQuests({
        cityId,
        orderedIds: ordered.map((q) => q.id),
      });
      if (res.error) {
        toast.error(res.error);
        setLocalQuests(previous);
        return;
      }
      toast.success("Порядок сохранён");
      router.refresh();
    });
  };

  const armActionsPointer = (e: ReactPointerEvent) => {
    e.stopPropagation();
    blockDragRef.current = true;
  };

  const clearActionsPointer = () => {
    blockDragRef.current = false;
  };

  const moveQuestBefore = (sourceId: string, targetId: string) => {
    if (archiveTab || !sourceId || sourceId === targetId || !tab) return;
    const list = [...cityQuests];
    const from = list.findIndex((q) => q.id === sourceId);
    const to = list.findIndex((q) => q.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    persistOrder(tab, list);
  };

  const onDragStart = (e: DragEvent<HTMLLIElement>, id: string) => {
    if (blockDragRef.current || pending || archiveTab || pointerDragRef.current) {
      e.preventDefault();
      return;
    }
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e: DragEvent<HTMLLIElement>, id: string) => {
    if (archiveTab) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overId !== id) setOverId(id);
  };

  const onDrop = (e: DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = dragId || e.dataTransfer.getData("text/plain");
    setDragId(null);
    setOverId(null);
    moveQuestBefore(sourceId, targetId);
  };

  const onDragEnd = () => {
    setDragId(null);
    setOverId(null);
    blockDragRef.current = false;
  };

  const onHandlePointerDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    id: string
  ) => {
    if (pending || archiveTab) return;
    // Мышь оставляем HTML5 DnD на всей строке; тач/стилус — через pointer.
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    pointerDragRef.current = {
      id,
      pointerId: e.pointerId,
      moved: false,
      overId: id,
    };
    setDragId(id);
    setOverId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    drag.moved = true;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const row = el?.closest("[data-quest-id]") as HTMLElement | null;
    const targetId = row?.dataset.questId ?? null;
    if (targetId && targetId !== drag.overId) {
      drag.overId = targetId;
      setOverId(targetId);
    }
  };

  const finishPointerDrag = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const sourceId = drag.id;
    const targetId = drag.overId;
    const moved = drag.moved;
    pointerDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    setDragId(null);
    setOverId(null);
    if (moved && targetId) moveQuestBefore(sourceId, targetId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {localQuests.length === 0
            ? "Квестов пока нет"
            : `Активных: ${activeQuests.length} · в архиве: ${archivedQuests.length}`}
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

      <div
        role="tablist"
        aria-label="Город или архив"
        className="flex flex-wrap gap-1.5"
      >
        {cities.map((city) => {
          const count = activeQuests.filter((q) => q.cityId === city.id).length;
          const active = city.id === tab;
          return (
            <button
              key={city.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={pending}
              onClick={() => setTab(city.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
                active
                  ? "border-border bg-card text-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              {city.name}
              <span className="text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={archiveTab}
          disabled={pending}
          onClick={() => setTab("archive")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
            archiveTab
              ? "border-border bg-card text-foreground"
              : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          )}
        >
          Архив
          <span className="text-xs tabular-nums text-muted-foreground">
            {archivedQuests.length}
          </span>
        </button>
      </div>

      {!archiveTab && cityQuests.length > 1 ? (
        <p className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <GripVertical
            className="mt-0.5 size-3.5 shrink-0 text-foreground/55"
            aria-hidden
          />
          <span>
            Порядок карточек на главной задаётся здесь — перетащите квесты
            местами (на телефоне — за иконку ⋮⋮ слева).
          </span>
        </p>
      ) : null}

      {archiveTab ? (
        <p className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Архивные квесты скрыты с главной. Можно вернуть в каталог или удалить
          навсегда.
        </p>
      ) : null}

      {visibleQuests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-card/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {archiveTab
            ? "Архив пуст."
            : localQuests.length === 0
              ? "Создайте первый сценарий кнопкой выше."
              : "В этом городе пока нет активных квестов."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleQuests.map((q) => {
            const isDragging = dragId === q.id;
            const isOver = Boolean(
              !archiveTab && overId === q.id && dragId && dragId !== q.id
            );
            return (
              <li
                key={q.id}
                data-quest-id={q.id}
                draggable={!pending && !archiveTab}
                onDragStart={(e) => onDragStart(e, q.id)}
                onDragOver={(e) => onDragOver(e, q.id)}
                onDrop={(e) => onDrop(e, q.id)}
                onDragEnd={onDragEnd}
                className={cn(
                  "relative rounded-xl border border-border/70 bg-card/40 p-3",
                  !archiveTab && "cursor-grab active:cursor-grabbing",
                  "transition-[transform,box-shadow,opacity,border-color] duration-150 ease-out",
                  isDragging &&
                    "scale-[0.98] opacity-55 shadow-lg shadow-black/25 ring-1 ring-white/10",
                  isOver && "border-blood/40 bg-card/65",
                  pending && "cursor-default"
                )}
              >
                {isOver ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-px right-4 left-4 z-10 h-px rounded-full bg-[var(--blood-hot)]/80"
                  />
                ) : null}
                <div className="flex items-start gap-2 sm:gap-3">
                  {!archiveTab ? (
                    <span
                      role="button"
                      tabIndex={-1}
                      aria-label={`Перетащить «${q.title}»`}
                      className={cn(
                        "mt-1 inline-flex size-10 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground sm:size-8",
                        !pending && "cursor-grab active:cursor-grabbing"
                      )}
                      onPointerDown={(e) => onHandlePointerDown(e, q.id)}
                      onPointerMove={onHandlePointerMove}
                      onPointerUp={finishPointerDrag}
                      onPointerCancel={finishPointerDrag}
                    >
                      <GripVertical className="size-5 sm:size-4" aria-hidden />
                    </span>
                  ) : null}
                  <CoverThumb
                    src={q.image}
                    alt={q.imageAlt?.trim() || q.title}
                    className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium leading-snug">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {archiveTab
                          ? `${q.cityName} · ${q.price} ₽`
                          : `${q.price} ₽ · порядок ${q.sortOrder + 1}`}
                      </p>
                    </div>
                    <div
                      className="flex flex-wrap gap-1.5"
                      data-no-drag
                      onPointerDown={armActionsPointer}
                      onPointerUp={clearActionsPointer}
                      onPointerCancel={clearActionsPointer}
                      onPointerLeave={clearActionsPointer}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 cursor-pointer"
                        disabled={pending}
                        onClick={() => openEdit(q)}
                      >
                        Изменить
                      </Button>
                      {archiveTab ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 cursor-pointer"
                            disabled={pending}
                            onClick={() =>
                              setConfirm({ kind: "restore", quest: q })
                            }
                          >
                            Вернуть
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 cursor-pointer text-destructive"
                            disabled={pending}
                            onClick={() =>
                              setConfirm({ kind: "delete", quest: q })
                            }
                          >
                            Удалить
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 cursor-pointer"
                          disabled={pending}
                          onClick={() =>
                            setConfirm({ kind: "archive", quest: q })
                          }
                        >
                          В архив
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
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

      <Dialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) closeConfirm();
        }}
      >
        <DialogContent showCloseButton={!pending} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "archive"
                ? "Убрать квест в архив?"
                : confirm?.kind === "restore"
                  ? "Вернуть квест в каталог?"
                  : "Удалить квест навсегда?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "archive"
                ? "Квест исчезнет с главной. Слоты и история броней сохранятся — позже можно вернуть."
                : confirm?.kind === "restore"
                  ? "Квест снова появится в каталоге выбранного города (в конце списка)."
                  : "Удаление необратимо. Если есть связанные брони, удаление может не пройти."}
            </DialogDescription>
          </DialogHeader>
          {confirm ? (
            <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
              <p className="font-medium">{confirm.quest.title}</p>
              <p className="text-sm text-muted-foreground">
                {confirm.quest.cityName} · {confirm.quest.price} ₽
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={closeConfirm}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant={confirm?.kind === "delete" ? "destructive" : "default"}
              disabled={pending}
              onClick={runConfirm}
            >
              {pending
                ? "Сохраняем…"
                : confirm?.kind === "archive"
                  ? "Да, в архив"
                  : confirm?.kind === "restore"
                    ? "Да, вернуть"
                    : "Да, удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
