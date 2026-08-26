-- Cities: Орёл + Смоленск; quests and actors belong to a city.

CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

INSERT INTO "City" ("id", "slug", "name", "createdAt", "updatedAt") VALUES
  ('c_oryol', 'oryol', 'Орёл', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c_smolensk', 'smolensk', 'Смоленск', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Quest" ADD COLUMN "cityId" TEXT;
UPDATE "Quest" SET "cityId" = 'c_oryol' WHERE "cityId" IS NULL;
ALTER TABLE "Quest" ALTER COLUMN "cityId" SET NOT NULL;

ALTER TABLE "Actor" ADD COLUMN "cityId" TEXT;
UPDATE "Actor" SET "cityId" = 'c_oryol' WHERE "cityId" IS NULL;
ALTER TABLE "Actor" ALTER COLUMN "cityId" SET NOT NULL;

CREATE INDEX "Quest_cityId_idx" ON "Quest"("cityId");
CREATE UNIQUE INDEX "Quest_cityId_title_key" ON "Quest"("cityId", "title");
CREATE INDEX "Actor_cityId_idx" ON "Actor"("cityId");

ALTER TABLE "Quest" ADD CONSTRAINT "Quest_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Actor" ADD CONSTRAINT "Actor_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
