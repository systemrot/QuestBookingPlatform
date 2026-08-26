"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { selectCity } from "@/app/actions/city";
import { Button } from "@/components/ui/button";

type Props = {
  suggestedSlug: string;
  suggestedName: string;
};

export function CitySuggestBanner({ suggestedSlug, suggestedName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const accept = () => {
    startTransition(async () => {
      const res = await selectCity(suggestedSlug);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const dismiss = () => {
    startTransition(async () => {
      // Фиксируем текущий default (Орёл), чтобы баннер не показывался снова.
      const res = await selectCity("oryol");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="border-b border-border/70 bg-muted/30 px-4 py-2 text-sm sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          Похоже, вы в городе{" "}
          <span className="font-medium text-foreground">{suggestedName}</span>.
          Показать квесты здесь?
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={pending}
            onClick={accept}
          >
            Да, {suggestedName}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            disabled={pending}
            onClick={dismiss}
          >
            Нет, Орёл
          </Button>
        </div>
      </div>
    </div>
  );
}
