-- AlterTable
ALTER TABLE "Quest" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill per city by current alphabetical title order
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY "cityId" ORDER BY title ASC) - 1)::INTEGER AS rn
  FROM "Quest"
)
UPDATE "Quest" q
SET "sortOrder" = ranked.rn
FROM ranked
WHERE q.id = ranked.id;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Quest_cityId_sortOrder_idx" ON "Quest"("cityId", "sortOrder");
