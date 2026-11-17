-- AlterTable
ALTER TABLE "Quest" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Quest_archivedAt_idx" ON "Quest"("archivedAt");
