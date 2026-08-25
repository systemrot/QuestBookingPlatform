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

/** Логотип VK (монохромный, currentColor). */
function VkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.161 4.03 8.033c0-.254.102-.491.524-.491h1.744c.391 0 .541.179.69.593.746 2.162 1.984 4.074 2.491 4.074.186 0 .274-.093.274-.593V9.721c-.056-1.016-.593-1.103-.593-1.465 0-.186.152-.373.391-.373h2.744c.338 0 .457.179.457.559v3.202c0 .338.152.457.254.457.186 0 .338-.119.678-.457 1.044-1.165 1.795-2.965 1.795-2.965.102-.22.271-.491.678-.491h1.744c.508 0 .62.271.508.559-.22.932-2.321 3.981-2.321 3.981-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-border/80 bg-background/40 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:gap-8">
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Связаться с нами
              </p>
              <ul className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <li>
                  <a
                    href={siteConfig.social.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm text-muted-foreground transition-colors",
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
                      "inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm text-muted-foreground transition-colors",
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

        <div className="mt-8 border-t border-border/60 pt-5 text-center text-xs text-muted-foreground sm:mt-10 sm:pt-6">
          © {new Date().getFullYear()} {siteConfig.brandName}. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
