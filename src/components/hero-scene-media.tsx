"use client";

import { useCallback, useEffect, useState } from "react";

import { HERO_CHARACTER_LQIP } from "@/components/hero-character-lqip";
import { cn } from "@/lib/utils";

type Props = {
  priority?: boolean;
};

async function revealWhenDecoded(
  img: HTMLImageElement,
  onReady: () => void
) {
  try {
    if (typeof img.decode === "function") {
      await img.decode();
    }
  } catch {
    // decode can reject on some browsers if already broken; fall through
  }
  if (img.complete && img.naturalWidth > 0) onReady();
}

/**
 * Progressive hero (preview → full):
 * - Preview paints a complete figure fast (~35KB).
 * - Full-res starts immediately at high priority (not "low") so fast networks
 *   upgrade to max quality quickly.
 * - Full stays invisible until decoded, then preview layers are removed so the
 *   sharp file is what you actually see.
 */
export function HeroSceneMedia({ priority = true }: Props) {
  const [cabinReady, setCabinReady] = useState(false);
  const [characterReady, setCharacterReady] = useState(false);

  const onCabinFull = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    void revealWhenDecoded(img, () => setCabinReady(true));
  }, []);

  const onCharacterFull = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    void revealWhenDecoded(img, () => setCharacterReady(true));
  }, []);

  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    for (const href of [
      "/brand/hero-character.webp",
      "/brand/hero-cabin.webp",
    ]) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.type = "image/webp";
      document.head.appendChild(link);
      links.push(link);
    }
    return () => {
      for (const link of links) link.remove();
    };
  }, []);

  return (
    <>
      <div className="home-split-cabin">
        {!cabinReady ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/brand/hero-cabin-preview.webp"
            alt=""
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            className="home-split-cabin-img absolute inset-0 size-full object-cover"
          />
        ) : null}
        {/* Full cabin: instant swap — preview is already the same frame, a fade just doubles motion. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/hero-cabin.webp"
          alt=""
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={cn(
            "home-split-cabin-img absolute inset-0 size-full object-cover",
            cabinReady ? "opacity-100" : "opacity-0"
          )}
          ref={onCabinFull}
          onLoad={(e) => onCabinFull(e.currentTarget)}
        />
      </div>

      <div className="home-split-content-veil" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/ui/veil-content-tr.png"
          alt=""
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 size-full object-fill object-right-top"
        />
      </div>

      <div className="home-split-character">
        {!characterReady ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_CHARACTER_LQIP}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-contain object-left-bottom scale-105 blur-md opacity-80"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hero-character-preview.webp"
              alt=""
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              className="absolute inset-0 size-full object-contain object-left-bottom"
            />
          </>
        ) : null}
        {/* Max quality — full 1536² WebP on all viewports */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/hero-character.webp"
          alt=""
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={cn(
            "absolute inset-0 size-full object-contain object-left-bottom",
            characterReady ? "opacity-100" : "opacity-0"
          )}
          ref={onCharacterFull}
          onLoad={(e) => onCharacterFull(e.currentTarget)}
        />
      </div>
    </>
  );
}
