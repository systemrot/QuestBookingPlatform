import Link from "next/link";

import { AdminMessagesLink } from "@/components/admin/admin-messages-link";
import { AdminToastListener } from "@/components/admin/admin-toast-listener";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6">
      <aside className="hidden w-60 shrink-0 rounded-xl border border-border/70 bg-card/40 p-3 lg:block">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Панель администратора
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", className: "justify-start" }))}>
            Расписание
          </Link>
          <AdminMessagesLink />
          <Link href="/admin/reports" className={cn(buttonVariants({ variant: "ghost", className: "justify-start" }))}>
            Отчеты
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", className: "justify-start" }))}>
            На сайт
          </Link>
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <AdminToastListener />
        <div className="mb-4 flex items-center justify-end lg:hidden">
          <AdminMessagesLink iconOnly />
        </div>
        {children}
      </section>
    </div>
  );
}

