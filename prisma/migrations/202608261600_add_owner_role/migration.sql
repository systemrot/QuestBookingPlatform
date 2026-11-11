-- Add OWNER role for content management (quests, actors).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';
