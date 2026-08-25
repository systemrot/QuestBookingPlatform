-- OAuth users may not have a local password.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
