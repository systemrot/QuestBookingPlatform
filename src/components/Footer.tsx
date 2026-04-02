import Link from "next/link";
import { Send } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const footerNav = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О нас" },
  { href: "/login", label: "Войти" },
  { href: "/register", label: "Регистрация" },
  { href: "/bookings", label: "Мои бронирования" },
] as const;

/** Логотип VK (упрощённый контур, монохромный под currentColor). */
function VkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-4.123-1.008-5.643-2.881-2.283-2.695-2.913-4.244-2.913-4.429 0-.186.051-.356.593-.356h1.745c.44 0 .593.17.593.458 0 .085 0 .356.356.949.763 1.49 1.575 2.695 1.981 2.695.187 0 .322-.102.322-.678V9.72c-.051-1.389-.814-1.507-1.135-1.525.678-.17 1.253-.356 1.591-.678 1.186-.508 2.018-1.895 2.018-2.966 0-.764-.186-1.389-.593-1.745C13.5 3.592 9.896 3.496 9.644 3.496c-.22 0-.356.153-.356.458v1.56c0 .678-.186 1.052-.186 1.135 0 .17.102.186.356.186h1.218c.678 0 .932.339.932.932v3.898c0 .678-.254 1.016-.932 1.016h-1.218c-.254 0-.356.017-.356.186 0 .119.085.678.254 1.033.254.508.678.932.932 1.084.508.322 2.153 1.389 3.645 1.389h1.745c.356 0 .593-.253.593-.593v-7.52c0-.254.153-.458.458-.458h.932c.356 0 .593-.186.593-.593V8.316c0-.356-.237-.593-.593-.593z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-zinc-800 bg-background/40 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-8">
          <div className="max-w-md space-y-3">
            <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
              {siteConfig.brandName}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {siteConfig.footerAbout}
            </p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-12 md:gap-16">
            <nav aria-label="Навигация в подвале" className="shrink-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Навигация
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {footerNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="shrink-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Связаться с нами
              </p>
              <ul className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <li>
                  <a
                    href={siteConfig.social.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-muted-foreground transition-colors",
                      "hover:border-[#24A1DE]/40 hover:text-[#24A1DE]",
                    )}
                  >
                    <Send className="size-4 shrink-0" aria-hidden />
                    Telegram
                  </a>
                </li>
                <li>
                  <a
                    href={siteConfig.social.vk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-muted-foreground transition-colors",
                      "hover:border-[#0077FF]/40 hover:text-[#0077FF]",
                    )}
                  >
                    <VkIcon className="size-4 shrink-0" />
                    ВКонтакте
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-800/80 pt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} {siteConfig.brandName}. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
