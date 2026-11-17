"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

import { selectCity } from "@/app/actions/city";

type Props = {
  slug: string;
  className?: string;
  children: ReactNode;
};

/**
 * City link that updates qb_city on real click only.
 * Prefetch is off so a viewport peek cannot overwrite the chosen city.
 */
export function CityNavLink({ slug, className, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Link
      href={`/${slug}`}
      prefetch={false}
      className={className}
      aria-disabled={pending || undefined}
      onClick={(e) => {
        if (pending) return;
        e.preventDefault();
        startTransition(async () => {
          const res = await selectCity(slug);
          if (res.error) return;
          router.push(`/${slug}`);
        });
      }}
    >
      {children}
    </Link>
  );
}
