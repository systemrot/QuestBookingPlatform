-- Booking holds + many bookings per slot (history of CANCELLED)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Drop 1:1 unique on slotId so cancelled bookings can free the slot for a new row
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_slotId_key";

CREATE INDEX IF NOT EXISTS "Booking_slotId_idx" ON "Booking"("slotId");
CREATE INDEX IF NOT EXISTS "Booking_status_expiresAt_idx" ON "Booking"("status", "expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Slot_questId_startTime_key" ON "Slot"("questId", "startTime");
CREATE INDEX IF NOT EXISTS "Slot_startTime_idx" ON "Slot"("startTime");
