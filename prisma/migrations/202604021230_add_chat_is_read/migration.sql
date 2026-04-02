ALTER TABLE "ChatMessage"
ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "ChatMessage_receiverId_isRead_idx"
ON "ChatMessage"("receiverId", "isRead");

