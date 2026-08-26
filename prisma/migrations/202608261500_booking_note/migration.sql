-- Admin notes / wishes on bookings.
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "note" TEXT;
