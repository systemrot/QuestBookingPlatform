/** Map legacy public cover paths to refreshed cinematic assets. */
const COVER_ALIASES: Record<string, string> = {
  "/Kluch.jpg": "/brand/covers/kluch-v3.jpg",
  "/Dyshi.jpg": "/brand/covers/dyshi-v5.jpg",
  "/Povorot.jpg": "/brand/covers/povorot-v4.jpg",
  "/kluch.jpg": "/brand/covers/kluch-v3.jpg",
  "/dyshi.jpg": "/brand/covers/dyshi-v5.jpg",
  "/povorot.jpg": "/brand/covers/povorot-v4.jpg",
  "/brand/covers/kluch.jpg": "/brand/covers/kluch-v3.jpg",
  "/brand/covers/dyshi.jpg": "/brand/covers/dyshi-v5.jpg",
  "/brand/covers/povorot.jpg": "/brand/covers/povorot-v4.jpg",
  "/brand/covers/dyshi-v3.jpg": "/brand/covers/dyshi-v5.jpg",
  "/brand/covers/dyshi-v4.jpg": "/brand/covers/dyshi-v5.jpg",
  "/brand/covers/povorot-v3.jpg": "/brand/covers/povorot-v4.jpg",
};

export function resolveQuestImage(src: string | null | undefined) {
  if (!src) return null;
  return COVER_ALIASES[src] ?? src;
}
