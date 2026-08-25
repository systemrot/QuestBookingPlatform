type CacheEntry = {
  expiresAt: number;
  value: unknown;
  tags: Set<string>;
};

type CacheGlobal = {
  appCache?: Map<string, CacheEntry>;
  appCacheInflight?: Map<string, Promise<unknown>>;
  appCacheTags?: Map<string, Set<string>>;
};

const globalForCache = globalThis as unknown as CacheGlobal;

function entries() {
  if (!globalForCache.appCache) globalForCache.appCache = new Map();
  return globalForCache.appCache;
}

function inflight() {
  if (!globalForCache.appCacheInflight) {
    globalForCache.appCacheInflight = new Map();
  }
  return globalForCache.appCacheInflight;
}

function tagIndex() {
  if (!globalForCache.appCacheTags) {
    globalForCache.appCacheTags = new Map();
  }
  return globalForCache.appCacheTags;
}

function indexTags(key: string, tags: string[]) {
  const index = tagIndex();
  const entry = entries().get(key);
  if (!entry) return;

  for (const tag of entry.tags) {
    index.get(tag)?.delete(key);
  }
  entry.tags = new Set(tags);
  for (const tag of tags) {
    if (!index.has(tag)) index.set(tag, new Set());
    index.get(tag)!.add(key);
  }
}

function unindexKey(key: string) {
  const entry = entries().get(key);
  if (!entry) return;
  const index = tagIndex();
  for (const tag of entry.tags) {
    index.get(tag)?.delete(key);
  }
}

/** Safety-net TTL. Prefer tag invalidation on writes; TTL only covers stale edge cases. */
export const CacheTTL = {
  quests: 5 * 60_000,
  userBookings: 5 * 60_000,
  userProfile: 5 * 60_000,
  adminSchedule: 60_000,
  adminActors: 60_000,
  availableSlots: 15_000,
} as const;

export const CacheTags = {
  quests: "quests",
  userBookings: (userId: string) => `user:${userId}:bookings`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  adminSchedule: "admin:schedule",
  adminActors: "admin:actors",
} as const;

export const CacheKeys = {
  questCatalog: "quests:catalog",
  userBookings: (userId: string) => `user:${userId}:bookings`,
  userProfilePage: (userId: string) => `user:${userId}:profile-page`,
  adminActors: "admin:actors-list",
  adminBookedSlots: "admin:booked-slots",
  adminActorStats: "admin:actor-stats",
  availableSlots: (questId: string, dateStr: string) =>
    `slots:${questId}:${dateStr}`,
} as const;

type ReadOptions = {
  ttlMs: number;
  tags?: string[];
};

/**
 * Read-through cache with singleflight: parallel misses share one DB call.
 * Use for page/list reads. Mutations must call invalidateByTag / invalidateUser*.
 *
 * Epoch: if invalidate happens while loader runs, result is not written back
 * (avoids stale empty admin/booking snapshots after a successful write).
 */
let cacheEpoch = 0;

export async function cachedRead<T>(
  key: string,
  options: ReadOptions,
  loader: () => Promise<T>
): Promise<T> {
  const map = entries();
  const hit = map.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  const pending = inflight();
  const existing = pending.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const epochAtStart = cacheEpoch;
  const promise = (async () => {
    const value = await loader();
    if (epochAtStart === cacheEpoch) {
      map.set(key, {
        value,
        expiresAt: Date.now() + options.ttlMs,
        tags: new Set(options.tags ?? []),
      });
      indexTags(key, options.tags ?? []);
    }
    return value;
  })();

  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}

export function invalidateByTag(...tags: string[]) {
  cacheEpoch += 1;
  const index = tagIndex();
  const map = entries();
  for (const tag of tags) {
    const keys = index.get(tag);
    if (!keys) continue;
    for (const key of [...keys]) {
      unindexKey(key);
      map.delete(key);
    }
    index.delete(tag);
  }
}

export function invalidateKeys(...keys: string[]) {
  cacheEpoch += 1;
  const map = entries();
  for (const key of keys) {
    unindexKey(key);
    map.delete(key);
  }
}

/** After booking create / payment / slot changes for a user. */
export function invalidateUserBookingData(userId: string) {
  invalidateByTag(CacheTags.userBookings(userId), CacheTags.userProfile(userId));
  invalidateByTag(CacheTags.adminSchedule);
  void import("@/lib/availability").then((m) => m.invalidateAvailabilityCache());
}

/** After profile edit. */
export function invalidateUserProfileData(userId: string) {
  invalidateByTag(CacheTags.userProfile(userId));
}

/** After actor assignment on a slot. */
export function invalidateAdminData() {
  invalidateByTag(CacheTags.adminSchedule, CacheTags.adminActors);
  invalidateKeys("admin:page-bundle");
  invalidateKeys("admin:page-bundle-v2");
  invalidateKeys("admin:page-bundle-v3");
  invalidateKeys("admin:page-bundle-v4");
  void import("@/lib/availability").then((m) => m.invalidateAvailabilityCache());
}

export function invalidateQuestCatalog() {
  invalidateByTag(CacheTags.quests);
}

/** Clear everything (tests / emergency). */
export function clearAppCache() {
  cacheEpoch += 1;
  entries().clear();
  inflight().clear();
  tagIndex().clear();
}

/** @deprecated use cachedRead */
export const cachedQuery = cachedRead;
/** @deprecated use invalidateByTag / invalidateUser* */
export function invalidateCache(prefix?: string) {
  if (!prefix) {
    clearAppCache();
    return;
  }
  const map = entries();
  for (const key of [...map.keys()]) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      unindexKey(key);
      map.delete(key);
    }
  }
}
/** @deprecated use CacheTTL */
export const CACHE_TTL = CacheTTL;
