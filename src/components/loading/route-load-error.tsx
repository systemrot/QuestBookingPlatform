"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  reset: () => void;
};

export function RouteLoadError({ reset }: Props) {
  return (
    <Card className="border-border/80 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base">Не удалось загрузить страницу</CardTitle>
        <CardDescription>
          Проверьте интернет и попробуйте ещё раз. Если проблема повторяется — напишите в
          поддержку через чат в углу экрана.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={cn(buttonVariants())}>
          Попробовать снова
        </button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          На главную
        </Link>
      </CardContent>
    </Card>
  );
}
