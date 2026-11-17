"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { DEFAULT_CITY_SLUG } from "@/lib/city-slug";

type Props = {
  className?: string;
  children: ReactNode;
  /** Server-known city; cookie wins after hydration if present. */
  fallbackSlug?: string;
};

function slugFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|; )qb_city=([^;]*)/);
  if (!match?.[1]) return null;
  const value = decodeURIComponent(match[1]);
  return value === "oryol" || value === "smolensk" ? value : null;
}

/** Brand / «Главная» / «На сайт» — всегда в выбранный город, без редиректа через `/`. */
export function CityHomeLink({
  className,
  children,
  fallbackSlug = DEFAULT_CITY_SLUG,
}: Props) {
  const [href, setHref] = useState(`/${fallbackSlug}`);

  useEffect(() => {
    const fromCookie = slugFromCookie();
    if (fromCookie) setHref(`/${fromCookie}`);
  }, []);

  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
