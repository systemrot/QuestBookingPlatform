import Link from "next/link";

import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";
import { siteConfig } from "@/config/site";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="min-w-0 shrink font-heading text-sm font-semibold tracking-tight text-foreground"
        >
          {siteConfig.brandName}
        </Link>
        <SiteNav session={session} />
      </div>
    </header>
  );
}
