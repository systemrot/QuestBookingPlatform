import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function PaymentReturnPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const ok = status === "success";

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-6 px-4 py-16">
      <div className="rounded-xl border border-border/80 bg-card/60 p-8 text-center backdrop-blur-sm">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {ok ? "Оплата отправлена" : "Оплата не завершена"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {ok
            ? "Если платёж прошёл успешно, статус бронирования обновится на «Оплачено» в течение минуты. При необходимости обновите страницу профиля."
            : "Вы отменили оплату или произошла ошибка. Бронирование останется в статусе «Ожидает оплаты», пока вы не оплатите снова."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/profile" className={cn(buttonVariants())}>
            Перейти в профиль
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
