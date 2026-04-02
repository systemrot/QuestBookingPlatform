CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_receiverId_idx"
ON "ChatMessage"("senderId", "receiverId");

