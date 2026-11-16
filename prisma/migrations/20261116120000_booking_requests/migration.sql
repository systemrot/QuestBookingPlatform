-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REQUEST';

-- AlterTable Booking: guest requests + contact fields
ALTER TABLE "Booking" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'REQUEST';

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "partySize" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;

CREATE INDEX IF NOT EXISTS "Booking_contactPhone_createdAt_idx" ON "Booking"("contactPhone", "createdAt");
