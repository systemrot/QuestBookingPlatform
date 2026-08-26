import { CacheKeys, CacheTags, CacheTTL, cachedRead } from "@/lib/cache";
import { db, dbUrgent } from "@/lib/prisma";

const userBookingSelect = {
  id: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  paymentId: true,
  slot: {
    select: {
      startTime: true,
      endTime: true,
      price: true,
      quest: {
        select: {
          title: true,
          city: { select: { name: true, slug: true } },
        },
      },
    },
  },
} as const;

export function getQuestCatalog(cityId: string) {
  return cachedRead(
    CacheKeys.questCatalog(cityId),
    { ttlMs: CacheTTL.quests, tags: [CacheTags.quests] },
    () =>
      dbUrgent((prisma) =>
        prisma.quest.findMany({
          where: { cityId },
          orderBy: { title: "asc" },
        })
      )
  );
}

export function getUserBookings(userId: string) {
  return cachedRead(
    CacheKeys.userBookings(userId),
    {
      ttlMs: CacheTTL.userBookings,
      tags: [CacheTags.userBookings(userId)],
    },
    () =>
      dbUrgent((prisma) =>
        prisma.booking.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: userBookingSelect,
        })
      )
  );
}

export function getUserProfilePage(userId: string) {
  return cachedRead(
    CacheKeys.userProfilePage(userId),
    {
      ttlMs: CacheTTL.userProfile,
      tags: [CacheTags.userProfile(userId), CacheTags.userBookings(userId)],
    },
    () =>
      dbUrgent(async (prisma) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            phone: true,
            age: true,
            role: true,
            createdAt: true,
          },
        });
        const bookings = await prisma.booking.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: userBookingSelect,
        });
        return { user, bookings };
      })
  );
}

export function getAvailableSlotsForDay(
  questId: string,
  dateStr: string,
  from: Date,
  to: Date
) {
  return cachedRead(
    CacheKeys.availableSlots(questId, dateStr),
    {
      ttlMs: CacheTTL.availableSlots,
      tags: [CacheTags.quests, CacheTags.adminSchedule],
    },
    async () => {
      const { findAvailableSlotsForQuestDay } = await import("@/lib/slots");
      return db((prisma) => findAvailableSlotsForQuestDay(prisma, questId, from, to));
    }
  );
}

export function getAdminActors(cityId?: string) {
  return cachedRead(
    CacheKeys.adminActors(cityId),
    { ttlMs: CacheTTL.adminActors, tags: [CacheTags.adminActors] },
    () =>
      dbUrgent((prisma) =>
        prisma.actor.findMany({
          where: cityId ? { cityId } : undefined,
          orderBy: { name: "asc" },
          select: { id: true, name: true, cityId: true },
        })
      )
  );
}

export function getAdminBookedSlots() {
  return cachedRead(
    CacheKeys.adminBookedSlots,
    { ttlMs: CacheTTL.adminSchedule, tags: [CacheTags.adminSchedule] },
    async () => {
      const now = new Date();
      return dbUrgent(async (prisma) =>
        prisma.slot.findMany({
          where: {
            bookings: {
              some: {
                OR: [
                  { status: "PAID" },
                  { status: "PENDING", expiresAt: { gt: now } },
                ],
              },
            },
          },
          select: {
            id: true,
            startTime: true,
            quest: {
              select: {
                title: true,
                city: { select: { id: true, slug: true, name: true } },
              },
            },
            bookings: {
              where: {
                OR: [
                  { status: "PAID" },
                  { status: "PENDING", expiresAt: { gt: now } },
                ],
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                status: true,
                expiresAt: true,
                user: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
            assignments: {
              orderBy: { id: "asc" },
              select: {
                actorId: true,
                actor: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { startTime: "asc" },
        })
      );
    }
  );
}

export function getAdminActorStats(cityId?: string) {
  return cachedRead(
    CacheKeys.adminActorStats(cityId),
    {
      ttlMs: CacheTTL.adminSchedule,
      tags: [CacheTags.adminSchedule, CacheTags.adminActors],
    },
    () =>
      dbUrgent((prisma) =>
        prisma.actor.findMany({
          where: cityId ? { cityId } : undefined,
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            city: { select: { name: true, slug: true } },
            assignments: {
              select: {
                slot: {
                  select: {
                    startTime: true,
                    endTime: true,
                  },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        })
      )
  );
}

export type AdminCityFilter = "all" | string;

/** Расписание админки: без in-memory cache — иначе после назначения актёров
 *  refresh часто отдавал старый пустой снимок (loader дописывал cache после invalidate). */
export async function getAdminPageData(citySlug: AdminCityFilter = "all") {
  const now = new Date();
  return dbUrgent(async (prisma) => {
    type ActorRow = { id: string; name: string; cityId: string };
    type Row = {
      id: string;
      startTime: Date;
      endTime: Date;
      questTitle: string;
      cityId: string;
      citySlug: string;
      cityName: string;
      bookingId: string;
      status: "PENDING" | "PAID" | "CANCELLED";
      expiresAt: Date | null;
      bookingCreatedAt: Date;
      userId: string;
      userName: string;
      userEmail: string;
      userPhone: string | null;
    };

    const actors = await prisma.$queryRaw<ActorRow[]>`
      SELECT id, name, "cityId" FROM "Actor" ORDER BY name ASC
    `;

    const rows =
      citySlug === "all"
        ? await prisma.$queryRaw<Row[]>`
      SELECT
        s.id,
        s."startTime",
        s."endTime",
        q.title AS "questTitle",
        c.id AS "cityId",
        c.slug AS "citySlug",
        c.name AS "cityName",
        b.id AS "bookingId",
        b.status,
        b."expiresAt",
        b."createdAt" AS "bookingCreatedAt",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u.phone AS "userPhone"
      FROM "Slot" s
      JOIN "Quest" q ON q.id = s."questId"
      JOIN "City" c ON c.id = q."cityId"
      JOIN LATERAL (
        SELECT b0.*
        FROM "Booking" b0
        WHERE b0."slotId" = s.id
          AND (
            b0.status = 'PAID'::"BookingStatus"
            OR (
              b0.status = 'PENDING'::"BookingStatus"
              AND b0."expiresAt" IS NOT NULL
              AND b0."expiresAt" > ${now}
            )
          )
        ORDER BY b0."createdAt" DESC
        LIMIT 1
      ) b ON true
      JOIN "User" u ON u.id = b."userId"
      ORDER BY s."startTime" ASC
    `
        : await prisma.$queryRaw<Row[]>`
      SELECT
        s.id,
        s."startTime",
        s."endTime",
        q.title AS "questTitle",
        c.id AS "cityId",
        c.slug AS "citySlug",
        c.name AS "cityName",
        b.id AS "bookingId",
        b.status,
        b."expiresAt",
        b."createdAt" AS "bookingCreatedAt",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u.phone AS "userPhone"
      FROM "Slot" s
      JOIN "Quest" q ON q.id = s."questId"
      JOIN "City" c ON c.id = q."cityId"
      JOIN LATERAL (
        SELECT b0.*
        FROM "Booking" b0
        WHERE b0."slotId" = s.id
          AND (
            b0.status = 'PAID'::"BookingStatus"
            OR (
              b0.status = 'PENDING'::"BookingStatus"
              AND b0."expiresAt" IS NOT NULL
              AND b0."expiresAt" > ${now}
            )
          )
        ORDER BY b0."createdAt" DESC
        LIMIT 1
      ) b ON true
      JOIN "User" u ON u.id = b."userId"
      WHERE c.slug = ${citySlug}
      ORDER BY s."startTime" ASC
    `;

    if (rows.length === 0) {
      return { actors, bookedSlots: [] as const };
    }

    const slotIds = rows.map((r) => r.id);
    const assignmentRows = await prisma.assignment.findMany({
      where: { slotId: { in: slotIds } },
      select: {
        slotId: true,
        actorId: true,
        actor: { select: { name: true } },
      },
      orderBy: { id: "asc" },
    });

    const assignsBySlot = new Map<
      string,
      { slotId: string; actorId: string; actorName: string }[]
    >();
    for (const row of assignmentRows) {
      const list = assignsBySlot.get(row.slotId) ?? [];
      list.push({
        slotId: row.slotId,
        actorId: row.actorId,
        actorName: row.actor.name,
      });
      assignsBySlot.set(row.slotId, list);
    }

    const bookedSlots = rows.map((row) => {
      const assigns = assignsBySlot.get(row.id) ?? [];
      return {
        id: row.id,
        startTime: row.startTime,
        endTime: row.endTime,
        quest: {
          title: row.questTitle,
          city: {
            id: row.cityId,
            slug: row.citySlug,
            name: row.cityName,
          },
        },
        bookings: [
          {
            id: row.bookingId,
            status: row.status,
            expiresAt: row.expiresAt,
            createdAt: row.bookingCreatedAt,
            user: {
              id: row.userId,
              name: row.userName,
              email: row.userEmail,
              phone: row.userPhone,
            },
          },
        ],
        assignments: assigns.map((a) => ({
          actorId: a.actorId,
          actor: { id: a.actorId, name: a.actorName },
        })),
      };
    });

    return { actors, bookedSlots };
  });
}
